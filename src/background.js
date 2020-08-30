import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';
import jQuery from 'jquery';
import { image } from '@tensorflow/tfjs';

const MOBILENSWFNET_MODEL_PATH = 'https://raw.githubusercontent.com/nmurray1984/MobileNSFW/master/trained_models/nsfw_v0.3-js/model.json';
const IMAGE_SIZE = 224;

class BackgroundProcessing {

  constructor() {
    this.imageRequests = {};
    this.addListeners();
    this.loadModel();
  }

  //from https://stackoverflow.com/a/8831937
  getHashCode(str) {
    var hash = 0;
    if (str.length == 0) {
        return hash;
    }
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  addListeners() {
    chrome.webRequest.onCompleted.addListener(req => {
      if (req && req.tabId > 0) {
        const hashCode = this.getHashCode(req.url)
        req.isDataImage = false;
        req.hashCode = hashCode;
        this.imageRequests[hashCode] = this.imageRequests[hashCode] || req;
        this.analyzeImage(req.url);
      }
    }, { urls: ["<all_urls>"], types: ["image", "object"] });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.payload && message.action === 'DATA_IMAGE_FOUND') {
        if (message && message.payload && message.payload.data) {
          message.payload.tabId = sender.tab.id;
          message.payload.isDataImage = true;
          const hashCode = this.getHashCode(message.payload.data);
          message.payload.hashCode = hashCode;
          this.imageRequests[hashCode] = this.imageRequests[hashCode] || message.payload;
          this.analyzeImage(message.payload.data);
        }
      }
    });
  }

  async loadModel() {
    console.log('Loading model...');
    const startTime = performance.now();
    //this.model = await tf.loadGraphModel(FLOWERSNET_MODEL_PATH);
    this.model = await tf.loadGraphModel(MOBILENSWFNET_MODEL_PATH);
    this.model.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])).dispose();
    console.log('Loaded model.')
    const totalTime = Math.floor(performance.now() - startTime);
    console.log(`Model loaded and initialized in ${totalTime}ms...`);
  }

  async loadImage(src) {
    return new Promise(resolve => {
      var img = document.createElement('img');
      img.crossOrigin = "anonymous";
      img.onerror = function(e) {
        resolve(null);
      };
      img.onload = function(e) {
        img.width = IMAGE_SIZE;
        img.height = IMAGE_SIZE;
        resolve(img);
      }
      img.src = src;
    });
  }

  async predict(imgElement) {
    console.log('Predicting... ' + imgElement.src.substring(0,100));
    const startTime = performance.now();
    const logits = tf.tidy(() => {
      const img = tf.browser.fromPixels(imgElement).toFloat();
      //TODO check if output is consistent from model running locally to ensure values here
      const offset = tf.scalar(127.5);
      const normalized = img.div(offset);
      const batched = normalized.reshape([1, IMAGE_SIZE, IMAGE_SIZE, 3]);
      return this.model.predict(batched);
    });
    const values = await logits.data();
    const totalTime = Math.floor(performance.now() - startTime);
    return values;
  }

  async getDataUri(imageElement) {
    var canvas = document.createElement('canvas');
    canvas.width = imageElement.width > IMAGE_SIZE ? IMAGE_SIZE : imageElement.width;
    canvas.height = imageElement.height > IMAGE_SIZE ? IMAGE_SIZE : imageElement.height;
    canvas.getContext('2d').drawImage(imageElement, 0, 0);
    const str = canvas.toDataURL('image/jpeg');
    return str;
  }

  async analyzeImage(src) {

    if (!this.model) {
      console.log('Model not loaded yet, delaying...');
      setTimeout(() => { this.analyzeImage(src) }, 5000);
      return;
    }

    var meta = this.imageRequests[this.getHashCode(src)];
    if (meta && meta.tabId) {
      if (!meta.predictions) {
        const img = await this.loadImage(src);
        if (img) {
          meta.predictions = await this.predict(img);
          const dataUri = await this.getDataUri(img);
        }
      }

      if (meta.predictions) {
        console.log("Sending predictions for: ", meta)
        chrome.tabs.sendMessage(meta.tabId, {
          action: 'IMAGE_PROCESSED',
          payload: {
            predictions: meta.predictions,
            hashCode: meta.hashCode
          },
        });
      }
    }
  }
}

var bg = new BackgroundProcessing();

chrome.contextMenus.create({
      title: "Show this image and report image URL",
      contexts: ["image"],
      onclick: function(info, tab) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'DONT_BLOCK'
        });
      }
});

chrome.contextMenus.create({
      title: "Block this image",
      contexts: ["image"],
      onclick: function(info, tab) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'BLOCK_THIS_IMAGE'
        });
      }
});

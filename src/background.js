import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';
import jQuery from 'jquery';
import { image } from '@tensorflow/tfjs';

const MOBILENET_MODEL_PATH = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json';
const MOBILENSWFNET_MODEL_PATH = 'https://raw.githubusercontent.com/nmurray1984/MobileNSFW/master/trained_models/nsfw_v0.3-js/model.json';
const FLOWERSNET_MODEL_PATH = 'https://raw.githubusercontent.com/nmurray1984/MobileNSFW/master/trained_models/flowers-js/model.json';
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
        //removed the block below for now to see how it impacts performance
        img.width = IMAGE_SIZE;
        img.height = IMAGE_SIZE;
        resolve(img);
        /*
        if ((img.height && img.height > 128) || (img.width && img.width > 128)) {
          // Set image size for tf!
          img.width = IMAGE_SIZE;
          img.height = IMAGE_SIZE;
          resolve(img);
        }
        // Let's skip all tiny images
        resolve(null);
        */
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

    // Convert logits to probabilities and class names.
    const values = await logits.data();
    const totalTime = Math.floor(performance.now() - startTime);
    //console.log(`Prediction done in ${totalTime}ms:`, values);
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

  async postImage(imageDataUri) {
    jQuery.post('http://localhost:8080/upload', {imageData: imageDataUri});
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
          if(meta.predictions[1] > 0.90 || meta.predictions[2] > 0.90) {
            this.postImage(dataUri);
          }
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

//chrome.contextMenus.removeAll();
chrome.contextMenus.create({
      title: "Report this - it shouldn't be blocked",
      contexts: ["image"],
      onclick: function(info, tab) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'DONT_BLOCK'
        });
      }
});

/*
chrome.contextMenus.create({
  title: "Report this - it should be blocked",
  contexts: ["image"],
  onclick: function() {
    alert('first');
  }
});
*/

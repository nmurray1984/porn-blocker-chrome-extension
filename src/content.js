var imageMeta = {};
var userFlagged = {};

const imageReplacement = "data:image/png;base64,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"

const setImageTitles = (messagePayload) => {
  const images = document.getElementsByTagName('img');
  for (i = 0; i < images.length; i++) {
    var img = images[i];
    hashCode = getHashCode(img.src);
    if (hashCode == messagePayload.hashCode) {
      //if(true) {
      const preds = messagePayload.predictions;
      if(
           (preds[2] > preds[1] && preds[2] > preds[0]) 
        || (preds[1] > preds[2] && preds[1] > preds[0]) 
        //|| preds[1] > 0.70 
        //|| preds[2] > 0.70
        ) {
        console.error('Image did not pass: ' + messagePayload.url, messagePayload);
        img.oldSrc = img.src;
        img.src = imageReplacement;
        img.title = `${img.title}\n\n` + JSON.stringify(messagePayload.predictions);
        if(img.hasAttribute('srcset'))
        {
          img.removeAttribute('srcset')
        }
      } else {
        img.title = `${img.title}\n\n` + JSON.stringify(messagePayload.predictions);
        //console.log('Image passed: ' + messagePayload.url)
      }
    }
  }
}

const findImages = () => {
  const imageElements = document.getElementsByTagName('img');
  for (i = 0; i < imageElements.length; i++) {
    var imageElement = imageElements[i];
      if(imageElement.src.startsWith('data')) {
        const message = {
          action: "DATA_IMAGE_FOUND",
          payload: {
            data: imageElement.src
          }
        }
        chrome.runtime.sendMessage(message);
      }
  }
}

//from https://stackoverflow.com/a/8831937
const getHashCode = (str) => {
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.payload && message.action === 'IMAGE_PROCESSED') {
    const { payload } = message;
    if (payload && payload.hashCode && payload.predictions) {
      if(!(payload.hashCode in userFlagged)) {
        imageMeta[payload.hashCode] = payload;
        setImageTitles(payload);
      }
    }
  }
});

window.addEventListener('load', findImages, false);


//capture events from background script when user wants to not block image
var mostRecentContextMenuImage = null;
document.addEventListener( "contextmenu", function(e) { mostRecentContextMenuImage = e.path[0];});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'DONT_BLOCK' && mostRecentContextMenuImage != null) {
    console.log(mostRecentContextMenuImage);
    mostRecentContextMenuImage.src = mostRecentContextMenuImage.oldSrc;
    userFlagged[getHashCode(mostRecentContextMenuImage.src)] = true;
    

    var oReq = new XMLHttpRequest();
    baseUrl = "https://nsfwserver6.azurewebsites.net/api/HttpTrigger1?code=OlaEukKoyHgxypAS7DpasualRRY7FwmsNqg/gfCD9yUfqKimvWyCoA==&url=";
    finalUrl = baseUrl + encodeURI(mostRecentContextMenuImage.src);
    oReq.open("GET", finalUrl);
    oReq.send();

    mostRecentContextMenuImage = null;
  }
});
# Porn Blocker Chrome Extension

Block porn images with AI. All images are scanned on your device and removed from the website if porn is detected.

## Purpose of this project

This project is meant to help build a dataset of control images to use in machine learning for porn detection.

Porn detection with computer vision is a difficult problem with varying levels of success. Nowadays best of breed porn detection is very good at correctly identifying porn, but also recognizes many images as false positives. This can be attributed to the datasets used for training. It is easy to scrape a website for porn images and train a classifier to correctly identify those images as porn, with a sample of control images used to make sure the classifier finds particular features in the images. In the case of porn, the assumption would be that particular body parts would be the features that determine whether an image is porn or not. The problem is that if the control images are not choosen well, the features could actually be too broad and classify images as porn that aren't even closely related. For instance, the NSFW Mobile classifier currently classifies some images of rockets and bananas as porn. A reasonable observer can surmise why that's the case. I hypothesize that there are significant other types of images that result in false positives. The only way to know is to gather a dataset of the false positive images, which is what this chrome extension strives to do.

## How it works

As you are browsing the web, the extension intercepts all image calls. The images are then sent through the Mobile NSFW classifier using TensorflowJS. This all takes place on your device. When an image is classified as porn, it will be replaced in the website as a red X.

If the image is classified incorrectly - say you are on a site where you know it is not porn, explicit, or racy, you have the option to report that image to help re-train the classifier so that these types of images are not detected as porn in the future. To do so, right click on the image and select "This shouldn't be blocked - send Image URL". 

All that we will receive is the URL of the image in question. We do not store any personal data or the actual image itself. If the image is not publically available, we wil not have access to it.

## Attribution

This project is based on the [Tensorflow Image Recognition Chrome Extension](https://github.com/JK0N/tensorflow-image-recognition-chrome-extension), which allowed me to focus on the aspects of machine learning, image blocking, and URL reporting. 


## Developing additions to it


```sh
git clone https://github.com/nmurray1984/porn-blocker-chrome-extension.git
```

```sh
cd porn-blocker-chrome-extension/
```

```sh
npm i
```

```sh
npm run build
```

- Open Google Chrome extensions page: chrome://extensions/

- Enable developer mode

- Click [LOAD UNPACKED]

- Select porn-blocker-chrome-extension/dist/ -folder!

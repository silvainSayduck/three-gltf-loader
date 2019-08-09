const ResourceLoadingManager = ({ onProgress }) => {
  let hasTextures = true;
  let hasBuffers = true;
  let texturesPendingFirstUpdate = [];
  let buffersPendingFirstUpdate = [];
  let progressStatuses = {};

  onProgressHandler = (xhr, url, type) => {
    switch (type) {
      case "texture":
        removeTexturePendingFirstUpdate(url);
        break;
      case "buffer":
        removeBufferPendingFirstUpdate(url);
        break;
      default:
        break;
    }
    const resourceTotal = xhr.total;
    const resourceLoaded = xhr.loaded;
    if (resourceTotal) {
      // computable length loading
      progressStatuses[url] = {
        total: resourceTotal,
        loaded: resourceLoaded
      };
    }
    let total = 0;
    let loaded = 0;
    for (let url in progressStatuses) {
      const progressStatus = progressStatuses[url];
      total += progressStatus.total;
      loaded += progressStatus.loaded;
    }
    const lengthComputable =
      total &&
      (!hasBuffers || !buffersPendingFirstUpdate.length) &&
      (!hasTextures || !texturesPendingFirstUpdate.length);
    onProgress(
      new ProgressEvent("progress", {
        lengthComputable,
        loaded: lengthComputable ? loaded : 0,
        total: lengthComputable ? total : 0
      })
    );
  };

  hasNoBuffers = () => {
    hasBuffers = false;
  };

  hasNoTextures = () => {
    hasTextures = false;
  };

  addTexturePendingFirstUpdate = url => {
    addPendingElement(texturesPendingFirstUpdate, url);
  };

  removeTexturePendingFirstUpdate = url => {
    removePendingElement(texturesPendingFirstUpdate, url);
  };

  addBufferPendingFirstUpdate = url => {
    addPendingElement(buffersPendingFirstUpdate, url);
  };

  removeBufferPendingFirstUpdate = url => {
    removePendingElement(buffersPendingFirstUpdate, url);
  };

  addPendingElement = (array, url) => {
    if (array.indexOf(url) === -1) {
      array.push(url);
    }
  };

  removePendingElement = (array, url) => {
    const textureIndex = array.indexOf(url);
    if (textureIndex !== -1) {
      array.splice(textureIndex, 1);
    }
  };

  return {
    onProgressHandler,
    hasNoBuffers,
    hasNoTextures,
    addTexturePendingFirstUpdate,
    addBufferPendingFirstUpdate
  };
};

module.exports = ResourceLoadingManager;

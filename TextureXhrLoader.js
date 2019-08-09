/**
 * @author mrdoob / http://mrdoob.com/
 */

var THREE = require("three");

function TextureXhrLoader(manager) {
  this.manager = manager !== undefined ? manager : DefaultLoadingManager;
}

Object.assign(TextureXhrLoader.prototype, {
  crossOrigin: "anonymous",

  load: function(url, onLoad, onProgress, onError) {
    var texture = new THREE.Texture();

    var loader = new ImageXhrLoader(this.manager);
    loader.setCrossOrigin(this.crossOrigin);
    loader.setPath(this.path);

    loader.load(
      url,
      function(image) {
        texture.image = image;

        // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
        var isJPEG =
          url.search(/\.jpe?g($|\?)/i) > 0 ||
          url.search(/^data\:image\/jpeg/) === 0;

        texture.format = isJPEG ? THREE.RGBFormat : THREE.RGBAFormat;
        texture.needsUpdate = true;

        if (onLoad !== undefined) {
          onLoad(texture);
        }
      },
      onProgress,
      onError
    );

    return texture;
  },

  setCrossOrigin: function(value) {
    this.crossOrigin = value;
    return this;
  },

  setPath: function(value) {
    this.path = value;
    return this;
  }
});

function ImageXhrLoader(manager) {
  this.manager = manager !== undefined ? manager : DefaultLoadingManager;
}

Object.assign(ImageXhrLoader.prototype, {
  crossOrigin: "anonymous",

  load: function(url, onLoad, onProgress, onError) {
    if (url === undefined) url = "";

    if (this.path !== undefined) url = this.path + url;

    url = this.manager.resolveURL(url);

    var scope = this;

    var cached = THREE.Cache.get(url);

    if (cached !== undefined) {
      scope.manager.itemStart(url);

      // ADDED check if image from Cache is loaded, since we add them to the cache on creation to avoid duplicate parallel requests
      if (cached.isLoaded) {
        setTimeout(function() {
          if (onLoad) onLoad(cached);

          scope.manager.itemEnd(url);
        }, 0);
      } else {
        // if image was in cache but not done loading, wait for it to be loaded before callback
        cached.addEventListener(
          "load",
          function(event) {
            if (onLoad) onLoad(cached);

            scope.manager.itemEnd(url);
          },
          false
        );
      }

      return cached;
    }

    var image = document.createElementNS("http://www.w3.org/1999/xhtml", "img");

    // ADDED xhr loading to support onprogress
    // https://github.com/mrdoob/three.js/issues/7734 (follow-up: https://github.com/mrdoob/three.js/issues/10439)

    THREE.Cache.add(url, image); // The object is set in cache before being loaded so subsequent calls will not request download again. However, it does not have any content and operations (like inversing colors) will fail.

    image.addEventListener(
      "load",
      function(event) {
        image.isLoaded = true;
        if (onLoad) onLoad(image);

        scope.manager.itemEnd(url);
      },
      false
    );

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.responseType = "arraybuffer";

    xhr.onload = function(e) {
      if (this.status == 200) {
        var response = this.response;
        var uInt8Array = new Uint8Array(response);
        var i = uInt8Array.length;
        var binaryString = new Array(i);
        while (i--) {
          binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        var data = binaryString.join("");

        var base64 = window.btoa(data);

        var type = this.getResponseHeader("Content-Type");
        if (type.indexOf(";") > 0) {
          type = type.substr(0, type.indexOf(";"));
        }
        image.src = "data:" + type + ";base64," + base64;
      } else {
        if (onError) onError(e);

        scope.manager.itemError(url);
      }
    };

    xhr.onprogress = function(event) {
      if (onProgress) onProgress(event);
    };

    xhr.onerror = function(event) {
      if (onError) onError(event);

      scope.manager.itemError(url);
    };

    xhr.send();

    return image;
  },

  setCrossOrigin: function(value) {
    this.crossOrigin = value;
    return this;
  },

  setPath: function(value) {
    this.path = value;
    return this;
  }
});

module.exports = TextureXhrLoader;

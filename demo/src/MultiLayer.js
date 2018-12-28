const style = document.createElement('style');
style.innerHTML = '.multi-custom-layer{position:absolute;top:0;left:0;width:100%;height:100%}';
document.head.appendChild(style);

class MultiLayer {
  constructor(container, {
    width, height,
  }) {
    this.root = container;
    container.style.height = `${height}px`;
    container.style.width = `${width}px`;
    this.root.addEventListener('click', this.eventHandler('click'));
  }

  addLayer(layer) {
    if (!(layer instanceof Layer)) {
      throw Error('Should be typeof Layer!');
    }
    layer.setSize(this.getSize());
    this.root.appendChild(layer.root);
  }

  getSize() {
    const { clientHeight: height, clientWidth: width } = this.root;
    return {
      height, width,
    };
  }

  handlers = {
    click: [],
  };

  eventHandler = (eventName) => (event) => {
    const handlers = this.handlers[eventName];
    if (!Array.isArray(handlers)) return;
    const { x, y } = event;
    handlers.forEach(({ handler, layer }) => {
      const { zoom } = layer.options;
      handler({
        y: y / zoom,
        x: x / zoom,
      }, event);
    });
  };

  on(eventName, handler, target) {
    let eventHandlers = this.handlers[eventName];
    if (!eventHandlers) {
      eventHandlers = [];
      this.handlers[eventName] = eventHandlers;
    }
    eventHandlers.push({
      handler,
      layer: target,
    });
  }

  off(eventName, handler) {
    const eventHandlers = this.handlers[eventName];
    const index = eventHandlers.indexOf(handler);
    if (index > -1) {
      eventHandlers.splice(index, 1);
    }
  }
}

/**
 * If fitSize, canvas width and height will be set automatically
 * as parent layer;
 */
class Layer {
  constructor(canvas, options) {
    const {
      zIndex = '1',
      opacity = '1',
      fitSize = false,
      zoom = 1,
    } = options;
    const wrapper = document.createElement('div');
    wrapper.classList.add('multi-custom-layer');
    wrapper.style.zIndex = zIndex;
    wrapper.style.opacity = opacity;
    wrapper.appendChild(canvas);
    this.options = {
      zIndex,
      opacity,
      fitSize,
      zoom,
    };
    this.root = wrapper;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  getSize() {
    const { width, height } = this.canvas;
    return { width, height };
  }

  setSize({ width, height }) {
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    const { fitSize, zoom } = this.options;
    if (fitSize) {
      this.canvas.width = width / zoom;
      this.canvas.height = height / zoom;
    }
  }

  clear() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
  }

  onRender() {}
}

export {
  Layer,
};

export default MultiLayer;

module.exports = class CanvasUtil {
  static applyText = (canvas, ctx, text, fontFamily, fontSize) => {
      do {
        ctx.font = `${fontSize -= fontSize/25}px ${fontFamily}`;
      } while (ctx.measureText(text).width > canvas.width - canvas.width*0.43)

      return ctx.font
    }
  
  static isFileImage(file) {
    return file && file['type'].split('/')[0] === 'image';
  }
  /**
   * @author [rishab](https://stackoverflow.com/users/11733466/rishab)
   */
  static drawHeart(fromx, fromy, lw, hlen, color, ctx, strokeS) {
    var x = fromx;
    var y = fromy;
    var width = lw ;
    var height = hlen;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = strokeS ?? color
    var topCurveHeight = height * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    // top left curve
    ctx.bezierCurveTo(
      x, y, 
      x - width / 2, y, 
      x - width / 2, y + topCurveHeight
    );

    // bottom left curve
    ctx.bezierCurveTo(
      x - width / 2, y + (height + topCurveHeight) / 2, 
      x, y + (height + topCurveHeight) / 2, 
      x, y + height
    );

    // bottom right curve
    ctx.bezierCurveTo(
      x, y + (height + topCurveHeight) / 2, 
      x + width / 2, y + (height + topCurveHeight) / 2, 
      x + width / 2, y + topCurveHeight
    );

    // top right curve
    ctx.bezierCurveTo(
      x + width / 2, y, 
      x, y, 
      x, y + topCurveHeight
    );

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
  /**
   * @return { String } - Hex cor aleatória
   */
  static randomColor() {
    return '#'+((1<<24)*(Math.random()+1)|0).toString(16).substr(1)
  }

  static randomRGBColorPastel() {
    let Rand = Math.floor(Math.random() * 10);
    return "rgb(" + (215 - Rand * 3) + "," + (185 - Rand * 5) + "," + (185 - Rand * 10) + " )";
  }
  
  static rgbToHex(r, g, b) {
    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  static hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}
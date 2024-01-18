import * as d3 from 'd3';
import _uniqueId from 'lodash/uniqueId';

/**
 * web颜色插值
 * @param {string} start - 开始值，格式:'#ff0000'
 * @param {string} end - 结束值，格式:'#ffffff'
 * @param {number} steps - 插值个数
 * @param {number} gamma - 伽马值
 * @returns {Array.<string>}
 */
export function gradientColors(start, end, steps, gamma) {
  const parseColor = hexStr => hexStr.length === 4 ?
    hexStr.substr(1).split("").map(s => 0x11 * parseInt(s, 16)) :
    [hexStr.substr(1, 2), hexStr.substr(3, 2), hexStr.substr(5, 2)].map(s => parseInt(s, 16));
  const pad = s => s.length === 1 ? `0${s}` : s;
  let j;
  let ms;
  let me;
  const output = [];
  const so = [];
  gamma = gamma || 1;
  const normalize = channel => (channel / 255) ** gamma;
  start = parseColor(start).map(normalize);
  end = parseColor(end).map(normalize);
  for (let i = 0; i < steps; i += 1) {
    ms = i / (steps - 1); me = 1 - ms;
    for (j = 0; j < 3; j += 1) {
      // eslint-disable-next-line 
      so[j] = pad(Math.round(Math.pow(start[j] * me + end[j] * ms, 1 / gamma) * 255).toString(16));
    }
    output.push(`#${so.join("")}`);
  }
  return output;
}

/**
 * 计算二阶贝塞尔曲线控制点的坐标
 * @param {Array.<number>} ps - 开始点
 * @param {Array.<number>} pe - 结束点
 * @param {number} arc - 距离
 * @returns {Array.<number>} - 控制点
 */
export function computeControlPoint(ps, pe, arc = 0.6) {
  const deltaX = pe[0] - ps[0];
  const deltaY = pe[1] - ps[1];
  const theta = Math.atan(deltaY / deltaX);
  const len = (Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 2) * arc;
  const newTheta = theta - Math.PI / 2;
  return [
    (ps[0] + pe[0]) / 2 + len * Math.cos(newTheta),
    (ps[1] + pe[1]) / 2 + len * Math.sin(newTheta),
  ];
}

/**
 * 根据开始点、控制点、结束点生成二次贝塞尔曲线path
 * @param {Object} point
 * @param {Array.<number>} point.startPoint - 开始点
 * @param {Array.<number>} point.controlPoint - 控制点
 * @param {Array.<number>} point.endPoint - 结束点
 * @returns {string}
 */
export function transPath(point) {
  return (
    `M${point.startPoint[0]} ${point.startPoint[1]} ` +
    `Q${point.controlPoint[0]} ${point.controlPoint[1]} ${point.endPoint[0]} ${point.endPoint[1]}`
  );
}

// 飞线类
export class FlyLine {
  /* 构造参数保存 */

  start = []; // 开始点

  end = []; // 结束点

  g = null; // svg画布实例

  projection = null; // 投影矩阵

  option = {}; // 参数

  /* 其他 */

  uniqId = 0;

  /**
   * 构造函数
   * @param {Object} g - svg的g实例
   * @param {Func} projection - 投影矩阵
   * @param {Array.<number>} start - 开始点
   * @param {Array.<number>} end - 结束点
   * @param {Object} option
   * @param {string} option.svgId - svg标签id
   * @param {string} option.radialGradientId - 蒙版渐变id
   */
  constructor(g, projection, start, end, option) {
    this.start = start;
    this.end = end;
    this.g = g;
    this.projection = projection;
    this.option = option;
    if (g && projection && start && end) {
      this.uniqId = _uniqueId();
      this.generateBaseLine();
      this.beginAnimate();
    }
  }

  beginAnimate = () => {
    this.generateMask();
    this.generateFlyLine();
  };

  // 生成飞行路线
  generateBaseLine = () => {
    const startPoint = this.projection(this.start);
    const endPoint = this.projection(this.end);
    const controlPoint = computeControlPoint(startPoint, endPoint);
    this.g
      .append('path')
      .attr('id', `baseLine${this.uniqId}`)
      .attr('stroke', 'rgba(255,255,255,0.3)')
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .attr('d', () => transPath({ startPoint, endPoint, controlPoint }))
      .attr('style', 'pointer-events:none');
  };

  // 生成飞线蒙版
  generateMask = () => {
    const svg = d3.select(`#${this.option?.svgId}`);
    let defs = svg.select('defs');
    if (!defs.node()) defs = svg.append('defs');
    defs
      .append('mask')
      .attr('id', `Mask${this.uniqId}`)
      .append('circle')
      .attr('id', `circle${this.uniqId}`)
      .attr('r', 150)
      .attr('fill', `url(#${this.option?.radialGradientId})`);
  };

  generateFlyLine = () => {
    const $path = d3.select(`#baseLine${this.uniqId}`).node();
    if (!$path) return;
    const l = $path.getTotalLength();
    this.g
      .append('path')
      .attr('id', `flyLine${this.uniqId}`)
      .attr('stroke', 'white')
      .attr('stroke-linecap', 'round')
      .attr('fill', 'none')
      .attr('stroke-width', 3)
      .attr('mask', `url(#Mask${this.uniqId})`)
      .transition()
      .duration(3000)
      .ease(d3.easeLinear)
      .attrTween('d', () => {
        const coord = $path
          .getAttribute('d')
          .replace(/(M|Q)/g, '')
          .match(/((\d|\.)+)/g);
        const x1 = +coord[0];
        const y1 = +coord[1]; // 起点
        const x2 = +coord[2];
        const y2 = +coord[3]; // 控制点
        // eslint-disable-next-line func-names
        return t => {
          const p = $path.getPointAtLength(t * l); // 新的终点
          const x = (1 - t) * x1 + t * x2;
          const y = (1 - t) * y1 + t * y2;
          d3.select(`#circle${this.uniqId}`)
            .attr('cx', p.x) // 蒙版坐标
            .attr('cy', p.y)
            .attr('r', l * 0.8); // 设置蒙版半径随路径长度变化
          return `M${x1},${y1} Q${x},${y} ${p.x},${p.y}`;
        };
      })
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attrTween('abc', () => t => {
        // 让蒙版半径缩小到0，模拟渐渐消失的效果
        d3.select(`#circle${this.uniqId}`).attr('r', l * 0.7 * (1 - t));
        if (t === 1) {
          this.generateWave();
        }
      });
  };

  generateWave = () => {
    const svg = d3.select(`#${this.option?.svgId}`);
    const width = svg?.node()?.getBBox()?.width;
    const maxR = width ? width / 25 : 20;
    const [cx, cy] = this.projection(this.end);
    this.g
      .append('circle')
      .attr('id', `wave${this.uniqId}`)
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', 0)
      .attr('fill', 'rgba(255,255,255,0.8)')
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attrTween('abc', () => t => {
        // 让蒙版半径缩小到0，模拟渐渐消失的效果
        d3.select(`#wave${this.uniqId}`)
          .attr('r', maxR * t)
          .style('opacity', 1 - t);
        if (t === 1) {
          this.destroyAnimaEle();
          this.beginAnimate();
        }
      });
  };

  // 销毁动画元素
  destroyAnimaEle = () => {
    d3.select(`#wave${this.uniqId}`).remove();
    d3.select(`#flyLine${this.uniqId}`).remove();
    d3.select(`#Mask${this.uniqId}`).remove();
  };
}

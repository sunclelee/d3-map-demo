/* eslint-disable react/destructuring-assignment */
/* eslint-disable func-names */
import React, { PureComponent } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import _get from 'lodash/get';
import PopTooltip from './PopTooltip';
import { FlyLine, gradientColors } from './func';
import { SVG_RATIO, PROVINCE_NUM } from '../config';

const colors = gradientColors('#7098cd', '#09286C', 5);

const colorSplit = [
  { min: -Infinity, max: 0, color: colors[0] },
  { min: 1, max: 5, color: colors[1] },
  { min: 6, max: 20, color: colors[2] },
  { min: 21, max: 50, color: colors[3] },
  { min: 51, max: Infinity, color: colors[4] },
];

class SvgMap extends PureComponent {
  state = {
    pop: {
      visible: false,
      x: 0,
      y: 0,
      record: {}
    },
  };

  geojson = null;

  componentDidMount() {
    this.drawMap();
  }

  componentDidUpdate(preProps) {
    if (preProps.height !== this.props.height || preProps.width !== this.props.width) {
      this.drawMap();
    }
  }

  getMapColor = num => colorSplit.find(c => c.min <= num && num <= c.max)?.color || '#fff';

  // 生成路径生成器
  generatePath = scale => {
    const projection = this.generateProjection(scale);
    return d3.geoPath(projection);
  };

  // 生成投影
  generateProjection = scale => {
    const { width, height } = this.props;
    return d3
      .geoMercator()
      // 这个中心是试出来的，要和底图吻合
      .center([108.8, 31.8])
      .scale(scale)
      .translate([width / 2, height / 2]);
  };

  drawMap = () => {
    const { width } = this.props;
    const changePop = pop => {
      this.setState({ pop });
    };
    d3.selectAll(`#svg-map > *`).remove();
    const svg = d3.select(`#svg-map`);
    this.appendRadialGradient(svg);
    const g = svg.append('g');
    const path = this.generatePath(width * SVG_RATIO);
    d3.json('/china.json').then(root => {
      this.geojson = root;
      g.selectAll('path')
        .data(root?.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('stroke', '#83BCFF')
        .attr('stroke-width', 1)
        .datum(d => {
          const number = _get(PROVINCE_NUM, d?.properties?.name, 0);
          return {
            name: d?.properties?.name,
            number,
            color: this.getMapColor(number),
          };
        })
        .attr('fill', d => d.color)
        .style('cursor', 'pointer')
        .on('mouseover', function(e) {
          changePop({ record: e.target?.__data__, visible: true, x: e.x, y: e.y });
          d3.select(this)
            .attr('fill', 'rgba(46,127,39)')
            .attr('stroke-width', 2);
        })
        .on('mouseout', function(e) {
          changePop({ record: {}, visible: false, x: 0, y: 0 });
          d3.select(this)
            .attr('fill', e.target?.__data__?.color)
            .attr('stroke-width', 1);
        });
      this.drawFlyLine(svg);
    });
  };

  // 添加飞线蒙版颜色
  appendRadialGradient = svg => {
    const radialGradient = svg
      .append('radialGradient')
      .attr('id', 'flyLineGrad')
      .attr('cx', 0.5)
      .attr('cy', 0.5)
      .attr('r', 0.5);
    radialGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#fff')
      .attr('stop-opacity', 1);
    radialGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#fff')
      .attr('stop-opacity', 0);
  };

  drawFlyLine = svg => {
    const { width } = this.props;
    const projection = this.generateProjection(width * SVG_RATIO);
    const sc = this.geojson?.features.find(f => f?.properties?.name === '四川省')?.properties?.cp;
    this.geojson?.features
      .filter(f => f?.properties?.name !== '四川省' && !!PROVINCE_NUM?.[f?.properties?.name])
      .map(i => i?.properties?.cp)
      .forEach(o => {
        const g = svg.append('g');
        // eslint-disable-next-line no-new
        new FlyLine(g, projection, sc, o, {
          svgId: 'svg-map',
          radialGradientId: 'flyLineGrad',
        });
      });
  };

  render() {
    const { pop } = this.state;
    return (
      <>
        <svg
          id="svg-map"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
        <PopTooltip {...pop} />
      </>
    );
  }
}

SvgMap.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
};

export default SvgMap;

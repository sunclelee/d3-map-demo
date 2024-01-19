import React, { PureComponent } from 'react';
import { MAP_WIDTH, MAP_HEIGHT } from './config';
import SvgMap from './SvgMap';
import mapBack from '../../assets/mapBack.jpg';

class MapWrap extends PureComponent {
  state = {
    scale: 1,
  };

  handleChange = (e) => {
    this.setState({
      scale: +e.target.value,
    });
  }

  render() {
    const { scale } = this.state;
    const width = MAP_WIDTH * scale;
    const height = MAP_HEIGHT * scale;
    return (
      <>
        <div>
          缩放比例
          <div style={{ display: 'flex' }}>
            {[0.5, 0.8, 1, 1.2, 1.5].map((item) => (
              <div key={item}>
                <input
                  type="radio"
                  name="number"
                  value={item}
                  checked={scale === item}
                  onChange={this.handleChange}
                />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div 
          style={{ 
            width,
            height,
            position: 'relative',
          }}
        >
          <img
            alt="地图"
            src={mapBack}
            style={{
              width: '100%',
            }}
          />
          <SvgMap width={width} height={height} />
        </div>
      </>
    );
  };
};

export default MapWrap;
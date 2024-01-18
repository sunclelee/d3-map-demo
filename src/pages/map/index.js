import React, { PureComponent } from 'react';
import { MAP_WIDTH } from '../config';
import SvgMap from './SvgMap';
import mapBack from '../../assets/mapBack.jpg';

class MapWrap extends PureComponent {
  state = {};

  render() {
    return (
      <div 
        style={{ 
          position: 'absolute', 
          left: 0, 
          top: 0, 
          width: MAP_WIDTH
        }}
      >
        <img
          alt="地图"
          src={mapBack}
          style={{
            width: '100%',
          }}
        />
        <SvgMap width={MAP_WIDTH} />
      </div>
    );
  };
};

export default MapWrap;
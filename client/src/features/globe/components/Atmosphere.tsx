import React from 'react';
import * as THREE from 'three';

const AtmosphereShader = {
  vertexShader: 
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  ,
  fragmentShader: 
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
      gl_FragColor = vec4(0.36, 0.88, 1.0, 1.0) * intensity;
    }
  
};

export function Atmosphere() {
  return (
    <mesh renderOrder={2}>
      <sphereGeometry args={[10.3, 64, 64]} />
      <shaderMaterial
        vertexShader={AtmosphereShader.vertexShader}
        fragmentShader={AtmosphereShader.fragmentShader}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}

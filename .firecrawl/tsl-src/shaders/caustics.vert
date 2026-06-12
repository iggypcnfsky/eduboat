varying vec2 vUv;

void main() {
 vUv = uv;
 gl\_Position = projectionMatrix \* modelViewMatrix \* vec4(position, 1.0);
}
varying vec3 csm_vWorldPosition;
varying vec3 csm_vPosition;
varying vec3 csm_vNormal;
varying vec2 csm_vUv;

#ifdef IS_MESHBASICMATERIAL
#include <packing>
#include <shadowmap_pars_fragment>
#endif

void main() {
    csm_vNormal = normal;
    csm_vUv = uv;
    csm_vPosition = position;
    csm_vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
}
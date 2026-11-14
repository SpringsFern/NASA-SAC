function srgbToLinear(value) {
  return `mix(${value} / 12.92, pow((${value} + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), ${value}))`;
}

export function applySurfacePainting(
  moon,
  basePaintTexture,
  selectedPaintTexture
) {
  const originals = [];

  moon.traverse((object) => {
    if (!object.isMesh) return;

    const originalMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    const paintedMaterials = originalMaterials.map((original) => {
      const material = original.clone();
      const previousCompile = material.onBeforeCompile;
      const previousCacheKey = material.customProgramCacheKey.bind(material);

      material.onBeforeCompile = (shader, renderer) => {
        previousCompile.call(material, shader, renderer);

        shader.uniforms.uBaseSitePaint = { value: basePaintTexture };
        shader.uniforms.uSelectedSitePaint = { value: selectedPaintTexture };

        shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          `#include <common>
          varying vec2 vSitePaintUv;`
        );

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vSitePaintUv = uv;`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `#include <common>
          uniform sampler2D uBaseSitePaint;
          uniform sampler2D uSelectedSitePaint;
          varying vec2 vSitePaintUv;

          vec3 siteSRGBToLinear(vec3 c) {
            vec3 low = c / 12.92;
            vec3 high = pow((c + 0.055) / 1.055, vec3(2.4));
            return mix(high, low, lessThanEqual(c, vec3(0.04045)));
          }`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>

          vec4 baseSitePaint = texture2D(uBaseSitePaint, vSitePaintUv);
          vec4 selectedSitePaint = texture2D(uSelectedSitePaint, vSitePaintUv);

          vec3 baseSiteColor = siteSRGBToLinear(baseSitePaint.rgb);
          vec3 selectedSiteColor = siteSRGBToLinear(selectedSitePaint.rgb);

          diffuseColor.rgb = mix(
            diffuseColor.rgb,
            baseSiteColor,
            baseSitePaint.a
          );

          diffuseColor.rgb = mix(
            diffuseColor.rgb,
            selectedSiteColor,
            selectedSitePaint.a
          );`
        );
      };

      material.customProgramCacheKey = () =>
        `${previousCacheKey()}|beyond-mission-surface-paint-v2`;

      material.needsUpdate = true;
      return material;
    });

    originals.push({ object, material: object.material });

    object.material = Array.isArray(object.material)
      ? paintedMaterials
      : paintedMaterials[0];
  });

  function dispose() {
    for (const { object, material } of originals) {
      const current = Array.isArray(object.material)
        ? object.material
        : [object.material];

      for (const item of current) item.dispose();
      object.material = material;
    }
    originals.length = 0;
  }

  return { dispose };
}

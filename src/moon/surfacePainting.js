export function applySurfacePainting(
  moon,
  basePaintTexture,
  selectedPaintTexture
) {
  const originals = [];

  moon.traverse((object) => {
    if (!object.isMesh) return;

    const sourceMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    const paintedMaterials = sourceMaterials.map((sourceMaterial) => {
      const material = sourceMaterial.clone();
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
          varying vec2 vSitePaintUv;`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>

          vec4 baseSitePaint = texture2D(uBaseSitePaint, vSitePaintUv);
          vec4 selectedSitePaint = texture2D(uSelectedSitePaint, vSitePaintUv);

          diffuseColor.rgb = mix(
            diffuseColor.rgb,
            baseSitePaint.rgb,
            baseSitePaint.a
          );

          diffuseColor.rgb = mix(
            diffuseColor.rgb,
            selectedSitePaint.rgb,
            selectedSitePaint.a
          );`
        );
      };

      material.customProgramCacheKey = () =>
        `${previousCacheKey()}|beyond-mission-surface-paint-v3`;

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

      current.forEach((item) => item.dispose());
      object.material = material;
    }

    originals.length = 0;
  }

  return { dispose };
}

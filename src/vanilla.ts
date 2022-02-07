import { IUniform, Material } from 'three'
import { iCSMProps, iCSMShader } from './types'

import * as PATCH_MAP from './patchMaps'

export default class CustomShaderMaterial extends Material {
  uniforms: { [key: string]: IUniform<any> }

  constructor(
    baseMaterial: iCSMProps['baseMaterial'],
    fragmentShader?: iCSMProps['fragmentShader'],
    vertexShader?: iCSMProps['vertexShader'],
    uniforms?: iCSMProps['uniforms'],
    opts?: any
  ) {
    // @ts-ignore
    const base = new baseMaterial(opts)
    super()

    for (const key in base) {
      // @ts-ignore
      if (this[key] === undefined) this[key] = 0
      // @ts-ignore
      this[key] = base[key]
    }

    const parsedFragmentShdaer = this.parseShader(fragmentShader)
    const parsedVertexShdaer = this.parseShader(vertexShader)

    this.uniforms = uniforms || {}

    this.onBeforeCompile = (shader) => {
      if (parsedFragmentShdaer) {
        const patchedFragmentShdaer = this.patchShader(parsedFragmentShdaer, shader.fragmentShader, PATCH_MAP.FRAG)

        shader.fragmentShader = patchedFragmentShdaer
      }
      if (parsedVertexShdaer) {
        const patchedVertexShdaer = this.patchShader(parsedVertexShdaer, shader.vertexShader, PATCH_MAP.VERT)

        shader.vertexShader = patchedVertexShdaer
      }

      shader.uniforms = { ...shader.uniforms, ...this.uniforms }
      this.uniforms = shader.uniforms
      this.needsUpdate = true
    }
  }

  private patchShader(
    customShader: iCSMShader,
    shader: string,
    patchMap: {
      [key: string]: string
    }
  ): string {
    let patchedShader: string = shader

    Object.keys(patchMap).forEach((key: string) => {
      const v = patchMap[key]!
      patchedShader = replaceAll(patchedShader, key, v)
    })

    patchedShader = patchedShader.replace(
      'void main() {',
      `
          ${customShader.header}
          void main() {
            vec3 csm_Position;
            vec3 csm_Normal;
            vec4 csm_DiffuseColor;
            float csm_PointSize;
            ${customShader.main}
          `
    )

    patchedShader = customShader.defines + patchedShader

    return patchedShader
  }

  private parseShader(shader?: string): iCSMShader | undefined {
    if (!shader) return
    const parsedShader: iCSMShader = {
      defines: '',
      header: '',
      main: '',
    }

    const main = shader.match(/void\s*main\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}/g)

    if (main?.length) {
      const mainBody = main[0].match(/\{((.|\n)*?)\}/g)

      if (mainBody?.length) {
        parsedShader.main = mainBody[0]
      }

      const rest = shader.replace(main[0], '')
      const defines = rest.match(/#(.*?;)/g) || []
      const header = defines.reduce((prev, curr) => prev.replace(curr, ''), rest)

      parsedShader.header = header
      parsedShader.defines = defines.join('\n')
    }

    return parsedShader
  }
}

const replaceAll = (str: string, find: string, rep: string) => str.split(find).join(rep)
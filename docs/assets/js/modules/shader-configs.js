// Per-brand shader background configs for the Visual Style page
// (docs/pages/visual-style.html), passed straight to shaders.com's
// createShader(). Exported verbatim from the shaders.com editor — brands
// with no entry here just get the plain dark/dot-grid CSS background
// (see visual-style.css) instead of a shader canvas.

export const SHADER_CONFIGS = {
  academy: {
    components: [
      {
        id: "idmm1ji0jwbo2w6dxps",
        props: {
          color: "#293747",
          visible: true,
        },
        type: "SolidColor",
      },
      {
        children: [
          {
            id: "idmma0kqskuqg80nzka",
            props: {
              colorA: "#26262b",
              colorB: "#0d111a",
              detail: 5,
              speed: 0.2,
            },
            type: "Swirl",
          },
          {
            id: "idmm1jm91alweku2l8u",
            props: {
              baseColor: "#04B870",
              downColor: "#43BBA4",
              leftColor: "#293747",
              momentum: 10,
              radius: 2,
              rightColor: "#04B870",
              upColor: "#3161B5",
            },
            type: "ChromaFlow",
          },
        ],
        id: "idmm1jgbk0fnwzbqm77",
        props: {
          blur: 20,
          cutout: true,
          edgeSoftness: 0,
          fresnel: 0,
          fresnelSoftness: 1,
          highlight: 0.15,
          highlightSoftness: 0.18,
          innerZoom: 1.5,
          lightAngle: 268,
          refraction: 0,
          scale: 0.75,
          shapeSdfUrl:
            "https://data.shaders.com/storage/v1/object/public/user-uploaded-images/user_3E93x1BOQFIvRduMb5kBj66tBhe/ZYDKpYDv5S8n_sdf.bin",
          thickness: 0.17,
        },
        type: "Glass",
      },
      {
        id: "idmma0qc1cdzw7qzjw3",
        props: {
          opacity: 0.1,
        },
        type: "FilmGrain",
      },
    ],
  },

  rolemodel: {
    components: [
      {
        id: "idmostv5d9xi2rmvn45",
        props: {
          baseColor: "#ffffff",
          downColor: "#ffffff",
          intensity: 1.5,
          leftColor: "#ffffff",
          momentum: 32,
          radius: 4,
          rightColor: "#ffffff",
          upColor: "#ffffff",
          visible: false,
        },
        type: "ChromaFlow",
      },
      {
        id: "idmostsrlvujw3m2cxq",
        props: {
          url: "https://data.shaders.com/storage/v1/object/public/user-uploaded-images/user_3E93x1BOQFIvRduMb5kBj66tBhe/jefUbfm0PjaT.jpg",
        },
        type: "ImageTexture",
      },
      {
        id: "idmot2a1w6g1hb7aovg",
        props: {
          scale: {
            channel: "alpha",
            curve: 0.1,
            inputMax: 1,
            inputMin: 0,
            outputMax: 181,
            outputMin: 180,
            source: "idmostv5d9xi2rmvn45",
            type: "map",
          },
        },
        type: "Pixelate",
      },
      {
        id: "idmot2dbqc9l1sb04fo",
        props: {
          maskSource: "idmostv5d9xi2rmvn45",
          url: "https://data.shaders.com/storage/v1/object/public/user-uploaded-images/user_3E93x1BOQFIvRduMb5kBj66tBhe/tAHUXKd4EOlk.png",
        },
        type: "ImageTexture",
      },

      {
        id: "idmr748xhouti7e9dh9",
        props: {
          colorA: "#3B70B3",
          colorB: "#0b1021",
        },
        type: "Duotone",
      },
    ],
  },
};

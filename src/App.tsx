import * as colorDiff from "color-diff";
import { Posterizer } from "potrace";
import { ChangeEventHandler, useState } from "react";
// @ts-ignore
import ColorThief from "colorthief";
import "./App.css";

const App = () => {
  const [image, setImage] = useState<string | null>(null);
  const [svgs, setSvgs] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [masks, setMasks] = useState<string[]>([]);

  function joinSVGs(svgArray: string[]) {
    const parser = new DOMParser();
    let totalWidth = 0;
    let maxHeight = 0;

    const content = svgArray
      .map((svg) => {
        const doc = parser.parseFromString(svg, "image/svg+xml");
        const svgElement = doc.documentElement;

        // Extract width and height attributes
        const width = parseFloat(svgElement.getAttribute("width") || "0");
        const height = parseFloat(svgElement.getAttribute("height") || "0");

        // Update total width and max height
        totalWidth = width;
        maxHeight = Math.max(maxHeight, height);

        // Extract inner content
        const innerContent = svgElement.innerHTML;

        return innerContent;
      })
      .join("");

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${maxHeight}">
        ${content}
      </svg>
    `;
  }

  const isColorMatch = (
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number,
    threshold: number = 10
  ): boolean => {
    const color1 = colorDiff.rgb_to_lab({ R: r1, G: g1, B: b1 });
    const color2 = colorDiff.rgb_to_lab({ R: r2, G: g2, B: b2 });

    // Calculate perceptual distance using color difference formula (CIEDE2000)
    const distance = colorDiff.diff(color1, color2);

    return distance < threshold;
  };

  // Function to extract colors from the image using Color Thief
  const extractColors = (imageSrc: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Ensure cross-origin compatibility if needed
      img.src = imageSrc;
      img.onload = () => {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 10); // Get the top 10 colors
        const colorStrings = palette.map((rgb: any) =>
          rgbToHex(rgb[0], rgb[1], rgb[2])
        );
        resolve(colorStrings);
      };
      img.onerror = reject;
    });
  };

  // Helper function to convert RGB to Hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b)
      .toString(16)
      .slice(1)
      .toUpperCase()}`;
  };

  // Function to create a color mask based on a target color
  const createColorMask = (
    imageSrc: string,
    targetColor: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          console.error("Failed to get canvas context");
          resolve("");
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const hexColor = targetColor.startsWith("#")
          ? targetColor.slice(1)
          : targetColor;
        const [r, g, b] = [
          parseInt(hexColor.slice(0, 2), 16),
          parseInt(hexColor.slice(2, 4), 16),
          parseInt(hexColor.slice(4, 6), 16),
        ];
        // console.log(data);

        for (let i = 0; i < data.length; i += 4) {
          const pixelR = data[i];
          const pixelG = data[i + 1];
          const pixelB = data[i + 2];

          if (!isColorMatch(pixelR, pixelG, pixelB, r, g, b)) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        const maskedImage = canvas.toDataURL("image/png");
        resolve(maskedImage);
      };
    });
  };

  const getSVG = (image: string, color?: string) => {
    const trace = new Posterizer();

    trace.loadImage(image, (error) => {
      if (error) {
        console.error("Trace Error: ", error);
        setLoading(false);
        return;
      }

      trace.setParameters({
        threshold: 200,
        color: color,
      });

      const content = trace.getSVG();

      setSvgs((prev) => [...prev, content]);
    });
  };

  // Function to generate SVG paths from image colors
  const generateSVGPaths = async (colored: boolean) => {
    if (!image || colors.length === 0) return;

    setLoading(true);
    setMasks([]);
    setSvgs([]);

    if (colored) {
      for (const color of colors) {
        // if (color == "#E3D4C4") continue;
        // if (!["#201A16", "#D4AC9C"].includes(color)) continue;

        const colorImage = await createColorMask(image, color);
        setMasks((prev) => [...prev, colorImage]);
        // console.log({colorImage});

        getSVG(image, color);
      }
    } else {
      getSVG(image);
    }

    setLoading(false);
  };

  // Handle image upload
  const onUpload: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.files) return;
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileSrc = reader.result as string;
        setImage(fileSrc);

        // Extract colors from the uploaded image
        extractColors(fileSrc).then((extractedColors) => {
          setColors(extractedColors);
        });
      };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  };

  // Function to handle SVG download
  const downloadSVG = () => {
    if (!svgs) return;

    const blob = new Blob([joinSVGs(svgs)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "generated_image.svg"; // Name of the downloaded file
    link.click();
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  return (
    <div className="app">
      <div>
        <input type="file" onChange={onUpload} />
        <button onClick={() => generateSVGPaths(false)} disabled={loading}>
          {loading ? "Processing..." : "Generate SVG"}
        </button>
        <button onClick={() => generateSVGPaths(true)} disabled={loading}>
          {loading ? "Processing..." : "Generate Color SVG"}
        </button>
      </div>

      {image && (
        <div>
          <img src={image} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {masks.map((item, index) => (
          <div style={{ border: "1px solid #f00" }} key={index}>
            <h6 style={{ background: colors[index] }}>{colors[index]}</h6>
            <img src={item} />
          </div>
        ))}
      </div>

      {svgs?.length > 0 && (
        <div>
          <h3>Generated SVG:</h3>
          <div
            style={{ width: "100%", height: "400px", overflow: "auto" }}
            dangerouslySetInnerHTML={{
              __html: joinSVGs(svgs),
            }}
          />

          <br />
          <br />

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {svgs.map((item, index) => (
              <div
                key={index}
                dangerouslySetInnerHTML={{
                  __html: item,
                }}
                style={{ border: "1px solid #f00" }}
              />
            ))}
          </div>

          <br />
          <br />
          <button onClick={downloadSVG}>Download SVG</button>
        </div>
      )}
    </div>
  );
};

export default App;

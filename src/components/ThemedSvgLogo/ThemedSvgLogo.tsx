import { useEffect, useState } from "react";

export type ThemedSvgLogoProps = {
  src: string;
  color: string;
  className?: string;
  ariaLabel?: string;
};

const isColorAttributeValue = (value: string | null): boolean => {
  if (!value) {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue !== "" && normalizedValue !== "none" && !normalizedValue.startsWith("url(");
};

const normalizeSvg = (svgSource: string, color: string, className?: string, ariaLabel?: string): string => {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(svgSource, "image/svg+xml");
  const svgNode = documentNode.querySelector("svg");

  if (!svgNode) {
    throw new Error("Invalid SVG");
  }

  svgNode.querySelectorAll("*").forEach((element) => {
    const fill = element.getAttribute("fill");
    if (isColorAttributeValue(fill)) {
      element.setAttribute("fill", "currentColor");
    }

    const stroke = element.getAttribute("stroke");
    if (isColorAttributeValue(stroke)) {
      element.setAttribute("stroke", "currentColor");
    }
  });

  svgNode.style.color = color;
  svgNode.setAttribute("fill", "currentColor");

  if (!svgNode.getAttribute("viewBox")) {
    const width = svgNode.getAttribute("width");
    const height = svgNode.getAttribute("height");
    if (width && height && !Number.isNaN(Number(width)) && !Number.isNaN(Number(height))) {
      svgNode.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
  }

  if (className) {
    svgNode.setAttribute("class", className);
  }

  if (ariaLabel) {
    svgNode.setAttribute("role", "img");
    svgNode.setAttribute("aria-label", ariaLabel);
  } else {
    svgNode.setAttribute("aria-hidden", "true");
  }

  return svgNode.outerHTML;
};

export const ThemedSvgLogo = ({ src, color, className, ariaLabel }: ThemedSvgLogoProps): JSX.Element | null => {
  const [svgMarkup, setSvgMarkup] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSvg = async (): Promise<void> => {
      try {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Could not load SVG: ${response.status}`);
        }

        const text = await response.text();
        const normalizedMarkup = normalizeSvg(text, color, className, ariaLabel);

        if (isMounted) {
          setSvgMarkup(normalizedMarkup);
        }
      } catch {
        if (isMounted) {
          setSvgMarkup("");
        }
      }
    };

    loadSvg();

    return () => {
      isMounted = false;
    };
  }, [src, color, className, ariaLabel]);

  if (!svgMarkup) {
    return null;
  }

  return <span dangerouslySetInnerHTML={{ __html: svgMarkup }} />;
};

function slugKey(value, fallback) {
  const key = String(value || fallback || "FIELD")
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
  return key || fallback || "FIELD";
}

function mapComponent(component) {
  const config = component.config || {};
  const name = config.name || slugKey(component.label, `FIELD_${component.id || Date.now()}`);

  switch (component.component_type) {
    case "text_heading":
      return { type: "TextHeading", text: component.label || config.text || "Heading" };
    case "text_body":
      return { type: "TextBody", text: config.text || component.label || "" };
    case "short":
      return {
        type: "TextInput",
        name,
        label: component.label,
        required: config.required !== false,
        "input-type": config.input_type || "text",
      };
    case "paragraph":
      return {
        type: "TextArea",
        name,
        label: component.label,
        required: config.required !== false,
      };
    case "single":
      return {
        type: "RadioButtonsGroup",
        name,
        label: component.label,
        required: config.required !== false,
        "data-source": (config.options || []).map((o, i) => ({
          id: String(o.id || o.value || `opt_${i + 1}`),
          title: String(o.title || o.label || `Option ${i + 1}`),
        })),
      };
    case "multiple":
      return {
        type: "CheckboxGroup",
        name,
        label: component.label,
        required: config.required !== false,
        "data-source": (config.options || []).map((o, i) => ({
          id: String(o.id || o.value || `opt_${i + 1}`),
          title: String(o.title || o.label || `Option ${i + 1}`),
        })),
      };
    case "dropdown":
      return {
        type: "Dropdown",
        name,
        label: component.label,
        required: config.required !== false,
        "data-source": (config.options || []).map((o, i) => ({
          id: String(o.id || o.value || `opt_${i + 1}`),
          title: String(o.title || o.label || `Option ${i + 1}`),
        })),
      };
    case "date":
      return {
        type: "DatePicker",
        name,
        label: component.label,
        required: config.required !== false,
      };
    case "opt_in":
      return {
        type: "OptIn",
        name,
        label: component.label,
        required: config.required !== false,
      };
    default:
      return {
        type: "TextInput",
        name,
        label: component.label || "Field",
        required: config.required !== false,
      };
  }
}

function buildFlowJson(screens) {
  const sorted = [...screens].sort((a, b) => a.screen_order - b.screen_order);

  const metaScreens = sorted.map((screen, index) => {
    const isLast = index === sorted.length - 1;
    const nextScreen = sorted[index + 1];
    const children = (screen.components || [])
      .sort((a, b) => a.component_order - b.component_order)
      .map(mapComponent)
      .filter(Boolean);

    const footerComponent = (screen.components || []).find((c) => c.component_type === "button");
    const footerLabel = footerComponent?.config?.label || footerComponent?.label || (isLast ? "Submit" : "Continue");

    children.push({
      type: "Footer",
      label: footerLabel,
      "on-click-action": isLast
        ? { name: "complete", payload: {} }
        : {
            name: "navigate",
            next: { type: "screen", name: nextScreen.screen_key },
          },
    });

    return {
      id: screen.screen_key,
      title: screen.title,
      terminal: isLast,
      success: isLast,
      data: {},
      layout: {
        type: "SingleColumnLayout",
        children,
      },
    };
  });

  return {
    version: "5.0",
    screens: metaScreens,
  };
}

module.exports = { buildFlowJson, slugKey, mapComponent };

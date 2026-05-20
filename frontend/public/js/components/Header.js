const React = window.React;

const Header = () => {
  return React.createElement(
    "header",
    { className: "header" },
    React.createElement(
      "div",
      { className: "container header-inner" },
      React.createElement(
        "h1",
        { className: "logo" },
        React.createElement("i", { className: "fa-solid fa-arrows-rotate" }),
        " PlusConversion"
      ),
      React.createElement(
        "p",
        { className: "tagline" },
        "Simple. Fast. Free File Conversion."
      )
    )
  );
};

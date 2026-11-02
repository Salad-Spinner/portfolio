function universalPrank() {
  // 1. Target text nodes directly to bypass element structure updates
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    // Only target numeric 4 characters to prevent breaks in standard words
    if (node.nodeValue === "4" || node.nodeValue === " 4 ") {
      node.nodeValue = "TOTALLY 5";
    }
  }

  // 2. Continuous real-time stream interception
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((addedNode) => {
        if (addedNode.nodeType === Node.TEXT_NODE && (addedNode.nodeValue === "4" || addedNode.nodeValue === " 4 ")) {
          addedNode.nodeValue = "TOTALLY 5";
        } else if (addedNode.nodeType === Node.ELEMENT_NODE) {
          const innerWalker = document.createTreeWalker(addedNode, NodeFilter.SHOW_TEXT, null, false);
          let innerNode;
          while ((innerNode = innerWalker.nextNode())) {
            if (innerNode.nodeValue === "4" || innerNode.nodeValue === " 4 " || innerNode.nodeValue.includes("4")) {
              innerNode.nodeValue = innerNode.nodeValue.replace(/4/g, "TOTALLY 5");
            }
          }
        }
      });
      
      // Monitor text mutations on output canvas elements
      if (mutation.type === "characterData" && mutation.target.nodeValue.includes("4")) {
        mutation.target.nodeValue = mutation.target.nodeValue.replace(/4/g, "TOTALLY 5");
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// Initialize execution immediately upon runtime injection
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", universalPrank);
} else {
  universalPrank();
}

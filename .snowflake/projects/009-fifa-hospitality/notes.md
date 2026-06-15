# 009 fifa-hospitality (scripted/slotizer, render-first)
Hardest raw input: dc-template runtime (sc-for/sc-if/{{}}), ALL inline styles, classless sections.
Render-first (file://, dc-runtime expands). 8 sections (7 classed via section-index + assigned firstClass, 1 static), 16 slots.
Fidelity EXACT: bodyText 4675=4675, scrollH 5123=5123, 0 errors. Fidelity from inline-style preservation; slots add authorability on headings/copy.
Fixed: DA section regex made attr-order-agnostic (class inserted at tag end on classless sections).

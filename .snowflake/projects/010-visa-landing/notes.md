# 010 visa-landing (dc-runtime, render-first)
6 sections (5 classed+1 static), 8 image-slots, 11 slots. Figtree.
FIDELITY: bodyText 1340=1340 (exact). scrollH overlay 3968 vs source-render 3658 (+310px):
section-4 two image placeholders render at their DECLARED inline height (440px/300px) in the
overlay, which the source live-render collapsed to 0. Overlay is byte-faithful to source markup;
delta is overlay honoring declared image heights (design-correct) vs source render glitch.
Slotizer fixes earned: multi-match contentRoot picks the candidate containing sections; removed
index-ignoring section fallback.

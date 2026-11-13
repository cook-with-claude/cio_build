// Touch gestures shared by the phone screens.

// Width (px) of the strips along the left and right screen edges that belong
// to the browser: on an iPhone, a swipe starting there goes back (left edge)
// or forward (right edge). Our own swipes ignore touches that start there.
export const SCREEN_EDGE = 24

export function startsAtScreenEdge(x, screenWidth) {
  return x < SCREEN_EDGE || x > screenWidth - SCREEN_EDGE
}

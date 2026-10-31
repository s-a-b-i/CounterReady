/** Provider error codes (AI Makeup VTO docs) mapped to messages a shopper can act on. */
const MESSAGES: Record<string, string> = {
  error_face_position_invalid: "We couldn't see your whole face. Use a photo where your full face is visible and unobstructed.",
  error_face_position_too_small: "Your face is too small in this photo. Move closer to the camera or crop the photo.",
  error_face_position_out_of_boundary: "Your face is too large or partly outside the frame. Step back a little and keep your whole face in view.",
  error_face_angle_invalid: "Your head is turned too far. Look straight at the camera, with your head within about 10 degrees.",
  error_below_min_image_size: "That photo is too small. Use one at least 400 px on its short side.",
  error_exceed_max_image_size: "That photo is too large for the preview service. Try a smaller one.",
  exceed_max_filesize: "That photo is too large. Use a JPG or PNG under 10 MB.",
  error_download_image: "The preview service couldn't read the uploaded photo. Please try again.",
  invalid_parameter: "The preview service didn't accept this shade's settings. Please try again.",
  unknown_internal_error: "The preview service hit an unexpected problem. Please try again.",
  RUNTIME_ERROR: "The preview service hit an unexpected problem. Please try again.",
  RATE_LIMIT: "The preview service is busy right now. Wait a few seconds and try again.",
  NO_RESULT: "The preview finished but returned no image. Please try again.",
  BAD_RESPONSE: "The preview service sent a response we couldn't read. Please try again.",
};

export function humanError(code?: string): string {
  return (code && MESSAGES[code]) || "Something went wrong generating this preview. Please try again.";
}

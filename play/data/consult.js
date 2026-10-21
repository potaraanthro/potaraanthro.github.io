// Ported from Nixy Live v4 consult.js (six of the ten questions)
export const QUESTIONS = [
 {
  "id": "use",
  "label": "Main use",
  "cam": "hero",
  "state": "legacy",
  "ask": "What is the room mainly for?",
  "opts": [
   {
    "t": "Hybrid team meetings",
    "react": "Hybrid-first. Noted.",
    "note": "Hybrid-first design: remote faces at eye level and every seat on camera."
   },
   {
    "t": "Client presentations",
    "react": "Presentation-first. Noted.",
    "note": "Presentation-first: content big and crisp, presenter well lit and framed."
   },
   {
    "t": "Training and workshops",
    "react": "Training room. Noted.",
    "note": "Training: wireless sharing, flexible seating, clear audio for questions."
   },
   {
    "t": "Board and leadership",
    "react": "Leadership spec. Noted.",
    "note": "Leadership: discreet technology, premium finish, one-touch join."
   }
  ]
 },
 {
  "id": "seats",
  "label": "People in the room",
  "cam": "top",
  "state": "legacy",
  "ask": "How many people, usually?",
  "opts": [
   {
    "t": "Up to 6",
    "react": "Framing for six.",
    "note": "Camera framing tuned for up to 6 around the near end of the table."
   },
   {
    "t": "6 to 10",
    "react": "Ten seats covered.",
    "note": "Camera and ceiling microphones cover all 10 seats."
   },
   {
    "t": "10 to 12",
    "react": "Full house. Wider camera.",
    "note": "Full room: wide-angle camera, far-seat sightlines checked, extra mic coverage."
   },
   {
    "t": "It varies a lot",
    "react": "Auto-framing, then.",
    "note": "Variable headcount: auto-framing camera that follows who is there."
   }
  ]
 },
 {
  "id": "platform",
  "label": "Call platform",
  "cam": "front",
  "state": "legacy",
  "ask": "Which call platform does your team use?",
  "opts": [
   {
    "t": "Microsoft Teams",
    "react": "Certified Teams Room.",
    "note": "Certified Microsoft Teams Rooms system, one-touch join."
   },
   {
    "t": "Zoom",
    "react": "Certified Zoom Room.",
    "note": "Certified Zoom Rooms system, one-touch join."
   },
   {
    "t": "Google Meet",
    "react": "Google Meet hardware.",
    "note": "Certified Google Meet hardware, one-touch join."
   },
   {
    "t": "A mix of them",
    "react": "Any platform, one room.",
    "note": "Native room system plus bring-your-own-laptop mode for other platforms."
   }
  ]
 },
 {
  "id": "content",
  "label": "On screen",
  "cam": "back",
  "state": "design",
  "ask": "What's usually on the screen?",
  "opts": [
   {
    "t": "Slides and video",
    "react": "Two 75-inch screens.",
    "note": "Displays: 2 × 75-inch. Meets AVIXA DISCAS for everyday content (farthest seat 5.4 m ÷ 6)."
   },
   {
    "t": "Spreadsheets and detail",
    "react": "86-inch, for detail.",
    "note": "Displays: step up to 2 × 86-inch. Detailed content needs farthest seat ÷ 4 (AVIXA DISCAS)."
   },
   {
    "t": "Designs or drawings",
    "react": "86-inch, colour-accurate.",
    "note": "Displays: 2 × 86-inch 4K, colour-accurate. Consider a touch screen for mark-up."
   },
   {
    "t": "Mostly faces",
    "react": "Faces at eye level.",
    "note": "People-first layout. Consider Front Row, with remote faces at eye level."
   }
  ]
 },
 {
  "id": "pain",
  "label": "Biggest headache",
  "cam": "ceiling",
  "state": "legacy",
  "ask": "What's the biggest problem today?",
  "opts": [
   {
    "t": "Remote people can't hear",
    "react": "Ceiling mics fix that.",
    "note": "Audio: ceiling microphone array with a zone per seat, echo cancellation tuned on site.",
    "cam": "ceiling"
   },
   {
    "t": "Echo and noise",
    "react": "Acoustic treatment added.",
    "note": "Acoustics: panels on two walls and carpet tiles, target reverb 0.4 to 0.6 seconds.",
    "cam": "side"
   },
   {
    "t": "Bad picture or lighting",
    "react": "Lighting and blinds added.",
    "note": "Light: diffused 4000 K LEDs, 300 to 500 lux on faces, blinds on the window.",
    "cam": "window"
   },
   {
    "t": "Cables and connecting",
    "react": "One cable, one box.",
    "note": "Cabling: table connectivity box, Cat6A to every device, everything labelled.",
    "cam": "low",
    "state": "cabling"
   }
  ]
 },
 {
  "id": "when",
  "label": "Timeline",
  "cam": "hero",
  "state": "live",
  "ask": "When would you like it ready?",
  "opts": [
   {
    "t": "Within a month",
    "react": "Fast track.",
    "note": "Fast track: survey this week, design pack straight after."
   },
   {
    "t": "1 to 3 months",
    "react": "Standard programme.",
    "note": "Standard programme: survey, design pack, approval, install."
   },
   {
    "t": "Later this year",
    "react": "Pencilled in.",
    "note": "Planned for later this year."
   },
   {
    "t": "Just exploring",
    "react": "No pressure.",
    "note": "Exploring: send the design pack sample and indicative pricing."
   }
  ]
 }
];

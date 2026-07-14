/**
 * "Signal Bits Lab" training data.
 *
 * IMPORTANT — public-safe content:
 * This is an illustrative, non-operational teaching model of a generic digital
 * frame. Field names, order, lengths, and bit values are fictional examples.
 * Real protocols vary widely: they may omit, combine, reorder, or add fields.
 * Nothing here represents a specific waveform, protocol, or operational system.
 */

export interface Segment {
  /** Stable identifier. */
  id: string;
  /** Full display name. */
  name: string;
  /** Short label used on the bracket row. */
  short: string;
  /** Example bit values (fictional). */
  bits: string;
  /** Accent color for this field. */
  color: string;
  /** Index into RECEIVE_FLOW that this field maps to. */
  flow: number;
  /** Plain-language explanation of the field. */
  description: string;
  /** The receiver-perspective question this field answers. */
  question: string;
  /** One-line key takeaway. */
  takeaway: string;
  /** Condensed summary shown on the field-guide legend card. */
  legend: string;
}

export interface FlowStep {
  title: string;
  body: string;
  color: string;
}

export interface FrameOverview {
  kicker: string;
  title: string;
  description: string;
  question: string;
  takeaway: string;
}

export const RECEIVE_FLOW: FlowStep[] = [
  {
    title: 'Detect energy and timing',
    body: 'The receiver identifies a signal and establishes symbol or bit timing.',
    color: '#59e1ff',
  },
  {
    title: 'Find synchronization',
    body: 'A known pattern marks a reliable alignment point in the incoming stream.',
    color: '#7ca8ff',
  },
  {
    title: 'Interpret control fields',
    body: 'Identifiers, lengths, types, and flags tell the receiver how to handle the frame.',
    color: '#ffd166',
  },
  {
    title: 'Extract and verify data',
    body: 'The payload is recovered and checked for corruption before being accepted.',
    color: '#ff7f9f',
  },
];

export const FRAME_OVERVIEW: FrameOverview = {
  kicker: 'Start here',
  title: 'Example received frame',
  description:
    'Each colored section has a different job. Move through the bitstream from left to right to see how a receiver turns a stream of binary values into a structured packet.',
  question: '“Where does the frame begin, and what does each section mean?”',
  takeaway: 'Bits gain meaning from their position and the protocol rules.',
};

export const SEGMENTS: Segment[] = [
  {
    id: 'preamble',
    name: 'Preamble',
    short: 'Preamble',
    bits: '10101010',
    color: '#59e1ff',
    flow: 0,
    description:
      'A repeating or otherwise predictable pattern that helps the receiver detect the signal and settle timing, gain, and other front-end processes before the important fields arrive.',
    question: '“Is a valid transmission starting, and where are the bit boundaries?”',
    takeaway: 'The preamble prepares the receiver; it usually does not contain user data.',
    legend: 'Helps detection and timing settle.',
  },
  {
    id: 'sync',
    name: 'Sync word',
    short: 'Syncwrd',
    bits: '11010011',
    color: '#7ca8ff',
    flow: 1,
    description:
      'A known bit pattern used to establish frame alignment. When the receiver finds this pattern, it can identify a precise reference point and begin parsing the following fields.',
    question: '“Have I found the protocol’s known alignment pattern?”',
    takeaway: 'The sync word distinguishes real frame starts from random matching bits.',
    legend: 'Marks a precise frame-alignment point.',
  },
  {
    id: 'netid',
    name: 'Network ID',
    short: 'Net ID',
    bits: '0110',
    color: '#ffd166',
    flow: 2,
    description:
      'An identifier that can associate the frame with a logical network, group, channel, or system. A receiver may reject frames whose identifier does not match its configuration.',
    question: '“Does this frame belong to the network or group I am monitoring?”',
    takeaway: 'Identifiers help receivers filter traffic before processing the payload.',
    legend: 'Associates the frame with a network.',
  },
  {
    id: 'header',
    name: 'Header',
    short: 'Header',
    bits: '10010110',
    color: '#bba2ff',
    flow: 2,
    description:
      'Control information describing how the rest of the frame should be interpreted. A header may include length, message type, source, destination, flags, sequence number, or other protocol-specific values.',
    question: '“How long is the frame, who is it for, and how should I decode it?”',
    takeaway: 'The header gives structure and context to the payload.',
    legend: 'Describes how to parse the frame.',
  },
  {
    id: 'payload',
    name: 'Payload',
    short: 'Payload',
    bits: '1100101010110010',
    color: '#ff7f9f',
    flow: 3,
    description:
      'The primary information being carried. Depending on the system, this could represent voice samples, text, telemetry, commands, sensor values, or another encoded data structure.',
    question: '“What useful information is this frame carrying?”',
    takeaway: 'The payload is the content; the surrounding fields make it deliverable and trustworthy.',
    legend: 'Carries the useful information.',
  },
  {
    id: 'crc',
    name: 'Integrity check',
    short: 'CRC',
    bits: '10110100',
    color: '#ffb366',
    flow: 3,
    description:
      'A checksum or cyclic redundancy check calculated from earlier bits. The receiver performs the same calculation and compares results to determine whether the frame was likely corrupted.',
    question: '“Did the frame arrive with errors?”',
    takeaway: 'A failed integrity check normally causes the receiver to discard or flag the frame.',
    legend: 'Checks whether bits were corrupted.',
  },
  {
    id: 'trailer',
    name: 'Trailer',
    short: 'Trailer',
    bits: '0111',
    color: '#78f0d4',
    flow: 3,
    description:
      'An optional ending field that can mark frame completion, carry final status information, provide padding, or return hardware and software to an idle state.',
    question: '“Has this frame ended cleanly?”',
    takeaway: 'Not every protocol uses a distinct trailer; some infer the end from length or timing.',
    legend: 'Optionally marks or supports frame end.',
  },
];

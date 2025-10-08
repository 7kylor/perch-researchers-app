declare module 'mupdf' {
  // Core Types
  export type Rect = [number, number, number, number]; // [ulx, uly, lrx, lry]
  export type Point = [number, number];
  export type Quad = [number, number, number, number, number, number, number, number];
  export type Color = [number, number, number] | [number, number, number, number];
  export type TransformMatrix = [number, number, number, number, number, number];

  // Matrix utilities
  export const Matrix = {
    identity: {} as TransformMatrix,
    scale: (sx: number, sy: number): TransformMatrix => [sx, 0, 0, sy, 0, 0],
    translate: (tx: number, ty: number): TransformMatrix => [1, 0, 0, 1, tx, ty],
    rotate: (degrees: number): TransformMatrix => {
      const rad = (degrees * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return [cos, sin, -sin, cos, 0, 0];
    },
  } as const;

  // ColorSpace class
  export class ColorSpace {
    static DeviceGray: ColorSpace;
    static DeviceRGB: ColorSpace;
    static DeviceCMYK: ColorSpace;
    static DeviceBGR: ColorSpace;

    destroy(): void;
  }

  // Buffer class
  export class Buffer {
    constructor(data: ArrayBuffer | Uint8Array | string);
    getLength(): number;
    readByte(at: number): number;
    writeByte(at: number, value: number): void;
    slice(start: number, end: number): Buffer;
    asUint8Array(): Uint8Array;
    asString(): string;

    destroy(): void;
  }

  // Pixmap class
  export class Pixmap {
    getWidth(): number;
    getHeight(): number;
    getX(): number;
    getY(): number;
    getStride(): number;
    getNumberOfComponents(): number;
    getAlpha(): number;
    getColorSpace(): ColorSpace;
    getSamples(): Uint8Array;
    asPNG(): Uint8Array;
    asJPEG(quality?: number): Uint8Array;
    clear(value?: number): void;
    getBounds(): Rect;

    destroy(): void;
  }

  // Image class
  export class Image {
    getWidth(): number;
    getHeight(): number;
    getXResolution(): number;
    getYResolution(): number;
    getColorSpace(): ColorSpace;
    toPixmap(ctm: TransformMatrix, colorspace: ColorSpace): Pixmap;

    destroy(): void;
  }

  // Font class
  export class Font {
    getName(): string;
    isBold(): boolean;
    isItalic(): boolean;
    isSerif(): boolean;
    isMonospaced(): boolean;

    destroy(): void;
  }

  // Text class
  export class Text {
    walk(walker: TextWalker): void;

    destroy(): void;
  }

  // TextWalker interface
  export interface TextWalker {
    beginSpan?(
      font: Font,
      matrix: TransformMatrix,
      wmode: number,
      bidi: number,
      dir: number,
      lang: string,
    ): void;
    showGlyph?(
      font: Font,
      matrix: TransformMatrix,
      glyph: number,
      unicode: number,
      wmode: number,
      bidi: number,
    ): void;
    endSpan?(): void;
  }

  // Path class
  export class Path {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
    closePath(): void;
    walk(walker: PathWalker): void;
    getBounds(stroke?: StrokeState, ctm?: TransformMatrix): Rect;

    destroy(): void;
  }

  // PathWalker interface
  export interface PathWalker {
    moveTo?(x: number, y: number): void;
    lineTo?(x: number, y: number): void;
    curveTo?(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
    closePath?(): void;
  }

  // StrokeState class
  export class StrokeState {
    constructor(options?: {
      lineCap?: number;
      lineJoin?: number;
      lineWidth?: number;
      miterLimit?: number;
      dashPhase?: number;
      dashes?: number[];
    });

    destroy(): void;
  }

  // Device interface
  export interface DeviceInterface {
    fillPath?(
      path: Path,
      evenOdd: boolean,
      ctm: TransformMatrix,
      colorSpace: ColorSpace,
      color: Color,
      alpha: number,
    ): void;
    strokePath?(
      path: Path,
      stroke: StrokeState,
      ctm: TransformMatrix,
      colorSpace: ColorSpace,
      color: Color,
      alpha: number,
    ): void;
    clipPath?(path: Path, evenOdd: boolean, ctm: TransformMatrix): void;
    clipStrokePath?(path: Path, stroke: StrokeState, ctm: TransformMatrix): void;
    fillText?(
      text: Text,
      ctm: TransformMatrix,
      colorSpace: ColorSpace,
      color: Color,
      alpha: number,
    ): void;
    strokeText?(
      text: Text,
      stroke: StrokeState,
      ctm: TransformMatrix,
      colorSpace: ColorSpace,
      color: Color,
      alpha: number,
    ): void;
    clipText?(text: Text, ctm: TransformMatrix): void;
    clipStrokeText?(text: Text, stroke: StrokeState, ctm: TransformMatrix): void;
    ignoreText?(text: Text, ctm: TransformMatrix): void;
    fillShade?(shade: Shade, ctm: TransformMatrix, alpha: number): void;
    fillImage?(image: Image, ctm: TransformMatrix, alpha: number): void;
    fillImageMask?(
      image: Image,
      ctm: TransformMatrix,
      colorSpace: ColorSpace,
      color: Color,
      alpha: number,
    ): void;
    clipImageMask?(image: Image, ctm: TransformMatrix): void;
    popClip?(): void;
    beginMask?(area: Rect, luminosity: boolean, colorspace: ColorSpace, color: Color): void;
    endMask?(): void;
    beginGroup?(
      area: Rect,
      isolated: boolean,
      knockout: boolean,
      blendmode: string,
      alpha: number,
    ): void;
    endGroup?(): void;
    beginTile?(
      area: Rect,
      view: Rect,
      xstep: number,
      ystep: number,
      ctm: TransformMatrix,
      id: number,
    ): number;
    endTile?(): void;
    beginLayer?(name: string): void;
    endLayer?(): void;
    beginStructure?(structure: string, raw: string, uid: string): void;
    endStructure?(): void;
    beginMetatext?(meta: string, metatext: string): void;
    endMetatext?(): void;
    renderFlags?(set: number, clear: number): void;
    setDefaultColorSpaces?(colorSpaces: DefaultColorSpaces): void;
    close?(): void;
  }

  // Device class
  export class Device {
    constructor(deviceInterface: DeviceInterface);

    close(): void;
    fillPath(
      path: Path,
      evenOdd: boolean,
      ctm: TransformMatrix,
      colorSpace: ColorSpace,
      color: Color,
      alpha: number,
    ): void;

    destroy(): void;
  }

  // DisplayList class
  export class DisplayList {
    run(device: Device, ctm: TransformMatrix): void;
    toPixmap(ctm: TransformMatrix, colorspace: ColorSpace, alpha: boolean): Pixmap;
    toStructuredText(options?: string): StructuredText;
    search(needle: string): Quad[][];

    destroy(): void;
  }

  // StructuredText class
  export class StructuredText {
    asText(): string;
    asJSON(): string;
    search(needle: string): Quad[][];
    highlight(p: Point, q: Point): Quad[];
    copy(p: Point, q: Point): string;
    walk(walker: StructuredTextWalker): void;

    destroy(): void;
  }

  // StructuredTextWalker interface
  export interface StructuredTextWalker {
    beginPage?(mediabox: Rect): void;
    endPage?(): void;
    beginBlock?(): void;
    endBlock?(): void;
    beginLine?(): void;
    endLine?(): void;
    beginChar?(char: string, origin: Point, font: Font, size: number, quad: Quad): void;
    endChar?(): void;
  }

  // Link class
  export class Link {
    getBounds(): Rect;
    getURI(): string;
    isExternal(): boolean;

    destroy(): void;
  }

  // LinkDestination interface
  export interface LinkDestination {
    type: 'Fit' | 'FitH' | 'FitV' | 'FitR' | 'FitB' | 'FitBH' | 'FitBV' | 'XYZ';
    page: number;
    zoom?: number;
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  }

  // Outline class
  export class OutlineIterator {
    item(): OutlineItem | null;
    next(): number;
    prev(): number;
    up(): number;
    down(): number;

    destroy(): void;
  }

  export class OutlineItem {
    getTitle(): string;
    getURI(): string;
    isOpen(): boolean;

    destroy(): void;
  }

  // Shade class
  export class Shade {
    getBounds(): Rect;

    destroy(): void;
  }

  // DefaultColorSpaces class
  export class DefaultColorSpaces {
    getDefaultGray(): ColorSpace;
    getDefaultRGB(): ColorSpace;
    getDefaultCMYK(): ColorSpace;
    getOutputIntent(): ColorSpace;

    destroy(): void;
  }

  // Page class
  export class Page {
    getBounds(): Rect;
    run(device: Device, ctm: TransformMatrix): void;
    runPageContents(device: Device, ctm: TransformMatrix): void;
    runPageAnnotations(device: Device, ctm: TransformMatrix): void;
    runPageWidgets(device: Device, ctm: TransformMatrix): void;
    toPixmap(
      ctm: TransformMatrix,
      colorspace: ColorSpace,
      alpha?: boolean,
      renderAnnotations?: boolean,
    ): Pixmap;
    toDisplayList(renderAnnotations?: boolean): DisplayList;
    toStructuredText(options?: string): StructuredText;
    getLinks(): Link[];
    createLink(bounds: Rect, uri: string): void;
    deleteLink(link: Link): void;
    search(needle: string, maxHits?: number): Quad[][];
    getLabel(): string;

    destroy(): void;
  }

  // Document class
  export class Document {
    static META_FORMAT: string;
    static META_ENCRYPTION: string;
    static META_INFO_AUTHOR: string;
    static META_INFO_TITLE: string;
    static META_INFO_SUBJECT: string;
    static META_INFO_KEYWORDS: string;
    static META_INFO_CREATOR: string;
    static META_INFO_PRODUCER: string;
    static META_INFO_CREATIONDATE: string;
    static META_INFO_MODDATE: string;

    static openDocument(data: ArrayBuffer | Uint8Array | Buffer | string, magic: string): Document;

    needsPassword(): boolean;
    authenticatePassword(password: string): number;
    countPages(): number;
    loadPage(pageNumber: number): Page;
    getMetaData(key: string): string;
    setMetaData(key: string, value: string): void;
    resolveLink(uri: string): number;
    outlineIterator(): OutlineIterator | null;
    loadOutline(): OutlineIterator | null;
    layout(width: number, height: number, em: number): void;

    isPDF(): boolean;

    destroy(): void;
  }

  // PDF-specific classes
  export class PDFDocument extends Document {
    static openDocument(
      data: ArrayBuffer | Uint8Array | Buffer | string,
      magic: string,
    ): PDFDocument;

    saveToBuffer(
      options:
        | string
        | {
            garbage?: boolean;
            pretty?: boolean;
            ascii?: boolean;
            linearize?: boolean;
            encrypt?: boolean;
          },
    ): Buffer;
    bake(): void;

    // Page operations
    deletePage(pageNumber: number): void;
    insertPage(at: number, page: PDFPage): void;
    addPage(mediabox: Rect, rotate: number, resources: PDFObject, contents: Buffer): PDFPage;
    graftPage(to: number, srcDoc: PDFDocument, srcPage: number): void;

    // Embedded files
    addEmbeddedFile(
      filename: string,
      mimetype: string,
      contents: Buffer | Uint8Array,
      createdAt: Date,
      modifiedAt: Date,
      checksum: boolean,
    ): PDFObject;
    getEmbeddedFiles(): Record<string, PDFObject>;
    deleteEmbeddedFile(filename: string): void;

    // Links
    formatLinkURI(dest: LinkDestination): string;
    resolveLinkDestination(link: Link): LinkDestination;

    // PDF Objects
    newNull(): PDFObject;
    newBoolean(value: boolean): PDFObject;
    newInteger(value: number): PDFObject;
    newReal(value: number): PDFObject;
    newString(value: string): PDFObject;
    newByteString(value: Uint8Array): PDFObject;
    newName(value: string): PDFObject;
    newIndirect(num: number, gen: number): PDFObject;
    newArray(): PDFObject;
    newDictionary(): PDFObject;

    getTrailer(): PDFObject;
    countObjects(): number;
    createObject(): PDFObject;
    deleteObject(obj: PDFObject): void;

    destroy(): void;
  }

  export class PDFPage extends Page {
    getAnnotations(): PDFAnnotation[];
    createAnnotation(type: string): PDFAnnotation;
    deleteAnnotation(annot: PDFAnnotation): void;
    applyRedactions(blackBoxes?: boolean, imageMethod?: number): void;

    getTransform(): TransformMatrix;
    setPageBox(box: string, rect: Rect): void;
    getPageBox(box: string): Rect;

    getWidgets(): PDFWidget[];

    getObject(): PDFObject;

    destroy(): void;
  }

  export class PDFAnnotation {
    getType(): string;
    getLanguage(): string;
    setLanguage(lang: string): void;

    getBounds(): Rect;
    setBounds(rect: Rect): void;

    hasRect(): boolean;
    getRect(): Rect;
    setRect(rect: Rect): void;

    hasAuthor(): boolean;
    getAuthor(): string;
    setAuthor(author: string): void;

    getCreationDate(): Date;
    setCreationDate(date: Date): void;

    getModificationDate(): Date;
    setModificationDate(date: Date): void;

    getContents(): string;
    setContents(text: string): void;

    toPixmap(ctm: TransformMatrix, colorspace: ColorSpace, alpha: boolean): Pixmap;

    hasIcon(): boolean;
    getIcon(): string;
    setIcon(icon: string): void;

    getColor(): Color;
    setColor(color: Color): void;

    hasInteriorColor(): boolean;
    getInteriorColor(): Color;
    setInteriorColor(color: Color): void;

    getOpacity(): number;
    setOpacity(opacity: number): void;

    // Line annotations
    getLine(): [Point, Point];
    setLine(start: Point, end: Point): void;

    getLineEndingStyles(): [string, string];
    setLineEndingStyles(start: string, end: string): void;

    // Border
    getBorderWidth(): number;
    setBorderWidth(width: number): void;

    getBorderStyle(): string;
    setBorderStyle(style: string): void;

    getBorderEffect(): string;
    setBorderEffect(effect: string): void;

    getBorderEffectIntensity(): number;
    setBorderEffectIntensity(intensity: number): void;

    // Polygon/polyline
    getVertices(): Point[];
    setVertices(vertices: Point[]): void;
    clearVertices(): void;
    addVertex(point: Point): void;
    setVertex(index: number, point: Point): void;

    // Ink
    getInkList(): Point[][];
    setInkList(inkList: Point[][]): void;
    clearInkList(): void;
    addInkListStroke(): void;
    addInkListStrokeVertex(point: Point): void;

    // Quad points
    getQuadPoints(): Quad[];
    setQuadPoints(quads: Quad[]): void;
    clearQuadPoints(): void;
    addQuadPoint(quad: Quad): void;

    // Redaction
    applyRedaction(blackBoxes?: boolean, imageMethod?: number): void;

    // File attachment
    hasFileSpec(): boolean;
    getFileSpec(): PDFObject | null;
    setFileSpec(filespec: PDFObject | null): void;

    // FreeText
    getDefaultAppearance(): { font: string; size: number; color: Color };
    setDefaultAppearance(font: string, size: number, color: Color): void;

    // Flags
    getFlags(): number;
    setFlags(flags: number): void;

    update(): void;
    updateAppearance(): void;

    getObject(): PDFObject;

    destroy(): void;
  }

  export class PDFWidget {
    getFieldType(): string;
    getFieldName(): string;
    getFieldValue(): string;
    setFieldValue(value: string): void;
    getFieldFlags(): number;

    isReadOnly(): boolean;

    destroy(): void;
  }

  export class PDFObject {
    isNull(): boolean;
    isBoolean(): boolean;
    isInteger(): boolean;
    isNumber(): boolean;
    isString(): boolean;
    isName(): boolean;
    isArray(): boolean;
    isDictionary(): boolean;
    isIndirect(): boolean;
    isStream(): boolean;

    asBoolean(): boolean;
    asNumber(): number;
    asString(): string;
    asName(): string;
    asByteString(): Uint8Array;

    resolve(): PDFObject;

    // Array methods
    length(): number;
    get(index: number | string): PDFObject;
    put(index: number | string, value: PDFObject): void;
    push(value: PDFObject): void;
    delete(index: number | string): void;

    // Dictionary methods
    has(key: string): boolean;

    // Stream methods
    readStream(): Uint8Array;
    readRawStream(): Uint8Array;
    writeObject(obj: PDFObject): void;
    writeStream(data: Buffer | Uint8Array): void;
    writeRawStream(data: Buffer | Uint8Array): void;

    getIndirect(): number;

    destroy(): void;
  }

  export class PDFGraftMap {
    constructor(doc: PDFDocument);
    graftObject(obj: PDFObject): PDFObject;
    graftPage(to: number, srcDoc: PDFDocument, srcPage: number): void;

    destroy(): void;
  }

  export interface PDFFilespecParams {
    filename: string;
    mimetype?: string;
    size?: number;
    creationDate?: Date;
    modificationDate?: Date;
  }
}

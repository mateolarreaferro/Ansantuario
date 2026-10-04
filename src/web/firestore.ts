/*
  The only part of 'firebase/firestore' the open wall needs: a Timestamp with
  the methods the UI calls, and deleteField for the toolbar's import. The web
  build aliases the package to this file, so the Firebase SDK stays out.
*/
export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number) {}

  static fromMillis(ms: number): Timestamp {
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6)
  }

  static now(): Timestamp {
    return Timestamp.fromMillis(Date.now())
  }

  toMillis(): number {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6)
  }

  toDate(): Date {
    return new Date(this.toMillis())
  }
}

export function deleteField(): undefined {
  return undefined
}

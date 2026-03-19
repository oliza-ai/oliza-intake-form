export interface BrokerageConfig {
  name: string;
  slug: string;
  pin: string;
  logoUrl: string;
  /** Flat array = no state selector; Record = state → regions two-step */
  regions: string[] | Record<string, string[]>;
}

export const brokerages: Record<string, BrokerageConfig> = {
  "duston-leddy": {
    name: "Duston Leddy Real Estate",
    slug: "duston-leddy",
    pin: "847293",
    logoUrl:
      "https://fczuwbuzglvzycfvirkt.supabase.co/storage/v1/object/public/branding/duston-leddy-logo.png",
    regions: {
      Maine: [
        "Southern Maine Coast",
        "Greater Portland Area",
        "Mid-Coast Maine",
        "Western Maine Mountains",
        "Northern / Central Maine",
      ],
      "New Hampshire": [
        "New Hampshire Seacoast",
        "Southern New Hampshire",
        "New Hampshire Lakes Region",
        "New Hampshire White Mountains",
      ],
    },
  },
  demo: {
    name: "Oliza Real Estate",
    slug: "oliza-real-estate",
    pin: "483726",
    logoUrl:
      "https://fczuwbuzglvzycfvirkt.supabase.co/storage/v1/object/public/branding/oliza-real-estate-logo.png",
    regions: [
      "Mid-Coast Maine",
      "Southern New Hampshire",
      "Greater Portland Area",
    ],
  },
};

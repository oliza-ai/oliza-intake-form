import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Home, Building2, Building, Sparkles, Briefcase, Laptop, Monitor, Palmtree, TreePine, MapPin, HomeIcon, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/duston-leddy-logo.png";

// Determine webhook URL based on environment
const getWebhookUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === "app.oliza.ai") {
    return "https://sparkevolution.app.n8n.cloud/webhook/buyer-guide-intake-prod";
  }
  // dev.oliza.ai, localhost, or any other hostname uses dev endpoint
  return "https://sparkevolution.app.n8n.cloud/webhook/buyer-guide-intake-dev";
};

const WEBHOOK_URL = getWebhookUrl();

// Form validation schema
const formSchema = z.object({
  agentEmail: z.string().email("Please enter a valid email address"),
  buyerName: z.string().min(1, "Buyer's name is required"),
  buyerSituation: z.string().min(1, "Please select a situation"),
  currentHome: z.string().max(300, "Maximum 300 characters").optional(),
  targetAreaPrimary: z.string().min(1, "Please select an area"),
  targetAreaSpecific: z.string().max(100, "Maximum 100 characters").optional(),
  commuteDestination: z.string().max(100, "Maximum 100 characters").optional(),
  budgetRange: z.array(z.number()).length(2),
  timeline: z.string().min(1, "Please select a timeline"),
  bedrooms: z.string().min(1, "Please select bedrooms"),
  bathrooms: z.string().min(1, "Please select bathrooms"),
  propertyTypes: z.array(z.string()).min(1, "Select at least one property type"),
  topPriority: z.string().min(1, "Please select a top priority"),
  workSituation: z.string().min(1, "Please select work arrangement"),
  hasChildren: z.boolean(),
  lifestyleFocus: z.string().min(1, "Please select a lifestyle priority"),
  agentInsights: z.string().min(200, "Please provide at least 200 characters").max(1200, "Maximum 1200 characters"),
});

type FormData = z.infer<typeof formSchema>;

const STORAGE_KEY = "buyer-guide-form-draft";

// Helper to format budget
const formatBudget = (value: number): string => {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(1)}M`;
  }
  return `$${value / 1000}K`;
};

// Budget steps: $25K from $250K-$1M, $50K from $1M-$2M, $100K from $2M-$5M, $250K from $5M-$10M
const budgetSteps = [
  // $250K - $1M in $25K increments
  250000, 275000, 300000, 325000, 350000, 375000, 400000, 425000, 450000, 475000,
  500000, 525000, 550000, 575000, 600000, 625000, 650000, 675000, 700000, 725000,
  750000, 775000, 800000, 825000, 850000, 875000, 900000, 925000, 950000, 975000, 1000000,
  // $1M - $2M in $50K increments
  1050000, 1100000, 1150000, 1200000, 1250000, 1300000, 1350000, 1400000, 1450000, 1500000,
  1550000, 1600000, 1650000, 1700000, 1750000, 1800000, 1850000, 1900000, 1950000, 2000000,
  // $2M - $5M in $100K increments
  2100000, 2200000, 2300000, 2400000, 2500000, 2600000, 2700000, 2800000, 2900000, 3000000,
  3100000, 3200000, 3300000, 3400000, 3500000, 3600000, 3700000, 3800000, 3900000, 4000000,
  4100000, 4200000, 4300000, 4400000, 4500000, 4600000, 4700000, 4800000, 4900000, 5000000,
  // $5M - $10M in $250K increments
  5250000, 5500000, 5750000, 6000000, 6250000, 6500000, 6750000, 7000000, 7250000, 7500000,
  7750000, 8000000, 8250000, 8500000, 8750000, 9000000, 9250000, 9500000, 9750000, 10000000
];

// Primary search area options with regions and major towns
const primarySearchAreas = [
  {
    label: "BROAD REGIONS",
    icon: "🗺️",
    options: [
      "New Hampshire Seacoast",
      "New Hampshire Lakes Region",
      "Northern New Hampshire",
      "Southern New Hampshire (Manchester/Nashua)",
      "Southern Maine Coast (Kittery to Portland)",
      "Greater Portland Area",
      "Mid-Coast Maine (Brunswick to Camden)",
      "Western Maine Mountains",
      "Northern/Central Maine"
    ]
  },
  {
    label: "MAJOR TOWNS - NEW HAMPSHIRE",
    icon: "🏔️",
    options: [
      "Portsmouth",
      "Dover",
      "Exeter",
      "Hampton",
      "Rye",
      "Durham",
      "Wolfeboro",
      "Laconia",
      "Meredith",
      "Manchester",
      "Nashua",
      "Concord",
      "Hanover"
    ]
  },
  {
    label: "MAJOR TOWNS - MAINE",
    icon: "🦞",
    options: [
      "Portland",
      "South Portland",
      "Kennebunk",
      "Kennebunkport",
      "Scarborough",
      "Cape Elizabeth",
      "Freeport",
      "Brunswick",
      "Camden",
      "Rockland",
      "Bar Harbor",
      "York",
      "Kittery",
      "Biddeford",
      "Gorham",
      "Yarmouth",
      "Bath",
      "Belfast"
    ]
  },
  {
    label: "OTHER",
    icon: "📍",
    options: ["Specific Town (not listed above)"]
  }
];

const BuyerGuideForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const defaultValues: FormData = {
    agentEmail: "",
    buyerName: "",
    buyerSituation: "first-time",
    currentHome: "",
    targetAreaPrimary: "New Hampshire Seacoast",
    targetAreaSpecific: "",
    commuteDestination: "",
    budgetRange: [10, 38], // Index for $500K and $1.2M
    timeline: "3-6",
    bedrooms: "3",
    bathrooms: "2",
    propertyTypes: ["single-family"],
    topPriority: "",
    workSituation: "hybrid",
    hasChildren: false,
    lifestyleFocus: "suburban",
    agentInsights: "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const watchedValues = watch();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((key) => {
          // Ensure budgetRange is always an array
          if (key === "budgetRange") {
            const value = parsed[key];
            if (Array.isArray(value) && value.length === 2) {
              setValue(key as keyof FormData, value);
            }
          } else if (key !== "targetArea") {
            // Skip old targetArea field, use new fields
            setValue(key as keyof FormData, parsed[key]);
          }
        });
      } catch (e) {
        console.error("Failed to parse saved form data");
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [setValue]);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedValues));
    }, 5000);
    return () => clearTimeout(timer);
  }, [watchedValues]);

  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmittedEmail(data.agentEmail);

    // Convert budget indices to actual values
    const minBudget = budgetSteps[data.budgetRange[0]];
    const maxBudget = budgetSteps[data.budgetRange[1]];

    const payload = {
      brokerage_slug: "duston-leddy",
      intake_pin: "847293",
      agent_email: data.agentEmail,
      buyer_name: data.buyerName,
      buyer_situation: data.buyerSituation,
      current_home: data.currentHome || "",
      primary_search_area: data.targetAreaPrimary,
      specific_location_notes: data.targetAreaSpecific || "",
      commute_destination: data.commuteDestination || "",
      budget_min: minBudget,
      budget_max: maxBudget,
      timeline: data.timeline,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      property_types: data.propertyTypes,
      top_priority: data.topPriority,
      work_situation: data.workSituation,
      has_children: data.hasChildren,
      lifestyle_focus: data.lifestyleFocus,
      agent_insights: data.agentInsights,
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log("Form submitted successfully:", payload);
      localStorage.removeItem(STORAGE_KEY);
      reset(defaultValues);
      setIsSuccess(true);
      toast({
        title: "Success!",
        description: `Your guide for ${data.buyerName} is being generated. Check your email in 3-5 minutes.`,
      });
    } catch (error) {
      console.error("Submission failed:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSubmittedEmail("");
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-[600px] bg-card rounded-xl shadow-lg p-8 md:p-12 text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-success animate-check-bounce" />
          </div>
          <h1 className="font-heading font-semibold text-2xl md:text-3xl text-foreground mb-3">
            Guide is Generating!
          </h1>
          <p className="text-text-secondary text-base md:text-lg mb-8">
            We'll email the completed guide to{" "}
            <span className="font-medium text-primary">{submittedEmail}</span>{" "}
            in 2-3 minutes.
          </p>
          <button
            onClick={handleReset}
            className="px-8 py-3 rounded-lg border-2 border-primary text-primary font-heading font-medium 
                       hover:bg-primary hover:text-primary-foreground transition-all duration-150"
          >
            Generate Another Guide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4 md:py-12 md:px-6">
      <div className="w-full max-w-[600px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <img
            src={logo}
            alt="Duston Leddy Real Estate"
            className="h-10 md:h-12 mx-auto mb-6"
          />
          <h1 className="font-heading font-semibold text-[28px] md:text-[32px] text-foreground mb-2">
            Generate Buyer Guide
          </h1>
          <p className="text-text-tertiary text-base">
            Get a personalized market presentation for your buyer in under 3 minutes
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-card rounded-xl shadow-lg p-6 md:p-8 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Section 1: Buyer Basics */}
          <div className="mb-8">
            <div className="space-y-5">
              {/* Agent Email */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  {...register("agentEmail")}
                  placeholder="agent@dustonleddy.com"
                  className="form-input"
                />
                {errors.agentEmail && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.agentEmail.message}
                  </p>
                )}
              </div>

              <h2 className="font-heading font-semibold text-lg text-foreground pt-2">
                About Your Buyer
              </h2>

              {/* Buyer Name */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Buyer's Name
                </label>
                <input
                  type="text"
                  {...register("buyerName")}
                  placeholder="Sarah and Mike Johnson"
                  className="form-input"
                />
                {errors.buyerName && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.buyerName.message}
                  </p>
                )}
              </div>

              {/* Buyer Situation */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Their Situation
                </label>
                <Controller
                  name="buyerSituation"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select situation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first-time">First-Time Buyer</SelectItem>
                        <SelectItem value="relocating">Relocating to Area</SelectItem>
                        <SelectItem value="upsizing">Upsizing</SelectItem>
                        <SelectItem value="downsizing">Downsizing</SelectItem>
                        <SelectItem value="investment">Investment Property</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Current Living Situation */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-1">
                  Current Living Situation
                </label>
                <span className="block text-sm text-text-tertiary mb-2">
                  Optional: Where do they live now? Renting/owning? Why moving?
                </span>
                <Controller
                  name="currentHome"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <textarea
                        {...field}
                        placeholder="Example: Renting in Boston, tired of city noise, wants yard for kids..."
                        rows={3}
                        maxLength={300}
                        className="form-input min-h-[80px] max-h-[150px] resize-y"
                      />
                      <span className="absolute bottom-2 right-3 text-xs text-text-tertiary">
                        {field.value?.length || 0}/300
                      </span>
                    </div>
                  )}
                />
              </div>

              {/* Primary Search Area */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Where are they looking?
                </label>
                <Controller
                  name="targetAreaPrimary"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select a region or major town">
                          {field.value || "Select a region or major town"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {primarySearchAreas.map((group) => (
                          <div key={group.label}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wide bg-muted flex items-center gap-1.5">
                              <span>{group.icon}</span>
                              <span>{group.label}</span>
                            </div>
                            {group.options.map((option) => (
                              <SelectItem 
                                key={option} 
                                value={option}
                                className="pl-4"
                              >
                                {option}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="mt-1.5 text-sm text-text-tertiary">
                  Select a region or major town
                </p>
              </div>

              {/* Specific Location Details */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Specific Location Details{" "}
                  <span className="text-text-tertiary font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  {...register("targetAreaSpecific")}
                  placeholder="e.g., 'Rangeley area' or 'Portsmouth preferred, but open to Rye or New Castle'"
                  maxLength={100}
                  className="form-input"
                />
                {errors.targetAreaSpecific && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.targetAreaSpecific.message}
                  </p>
                )}
              </div>

              {/* Commute Destination */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-1">
                  Commute Destination
                </label>
                <span className="block text-sm text-text-tertiary mb-2">
                  Optional: Where does buyer need to commute?
                </span>
                <input
                  type="text"
                  {...register("commuteDestination")}
                  placeholder="Example: Portsmouth Naval Shipyard, Boston, etc."
                  maxLength={100}
                  className="form-input"
                />
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Budget Range
                </label>
                <Controller
                  name="budgetRange"
                  control={control}
                  render={({ field }) => (
                    <div className="pt-2 pb-4">
                      <div className="flex justify-between mb-4">
                        <span className="font-heading font-semibold text-lg text-primary">
                          {formatBudget(budgetSteps[field.value[0]])}
                        </span>
                        <span className="text-text-tertiary">to</span>
                        <span className="font-heading font-semibold text-lg text-primary">
                          {formatBudget(budgetSteps[field.value[1]])}
                        </span>
                      </div>
                      <Slider
                        defaultValue={field.value}
                        value={field.value}
                        onValueChange={field.onChange}
                        min={0}
                        max={budgetSteps.length - 1}
                        step={1}
                        minStepsBetweenThumbs={1}
                      />
                    </div>
                  )}
                />
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  When are they looking to buy?
                </label>
                <Controller
                  name="timeline"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { value: "asap", label: "ASAP" },
                        { value: "1-3", label: "1-3 months" },
                        { value: "3-6", label: "3-6 months" },
                        { value: "6+", label: "6+ months" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={`btn-group-item ${
                            field.value === option.value ? "btn-group-item-selected" : ""
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Property Essentials */}
          <div className="mb-8">
            <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
              Property Preferences
            </h2>

            <div className="space-y-5">
              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Bedrooms
                </label>
                <Controller
                  name="bedrooms"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2">
                      {["2", "3", "4", "5+"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => field.onChange(option)}
                          className={`btn-group-item w-20 ${
                            field.value === option ? "btn-group-item-selected" : ""
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Bathrooms */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Bathrooms
                </label>
                <Controller
                  name="bathrooms"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2">
                      {["1", "2", "2.5", "3+"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => field.onChange(option)}
                          className={`btn-group-item w-20 ${
                            field.value === option ? "btn-group-item-selected" : ""
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-1">
                  Property Type
                </label>
                <span className="block text-sm text-text-tertiary mb-3">
                  Select all that apply
                </span>
                <Controller
                  name="propertyTypes"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: "single-family", label: "Single Family", icon: Home },
                        { value: "townhouse", label: "Townhouse", icon: Building2 },
                        { value: "condo", label: "Condo", icon: Building },
                        { value: "new-construction", label: "New Construction", icon: Sparkles },
                      ].map((option) => {
                        const Icon = option.icon;
                        const isSelected = field.value.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value.filter((v) => v !== option.value)
                                : [...field.value, option.value];
                              field.onChange(newValue.length ? newValue : [option.value]);
                            }}
                            className={`selection-card h-24 ${
                              isSelected ? "selection-card-selected" : ""
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                            <Icon className={`w-6 h-6 mb-2 ${isSelected ? "text-primary" : "text-text-tertiary"}`} />
                            <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-text-secondary"}`}>
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              {/* Top Priority */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-1">
                  Top Priority <span className="text-destructive">*</span>
                </label>
                <span className="block text-sm text-text-tertiary mb-2">
                  What matters most to this buyer?
                </span>
                <Controller
                  name="topPriority"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select priority..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waterfront">Waterfront/Water Views</SelectItem>
                        <SelectItem value="schools">Top-Rated Schools</SelectItem>
                        <SelectItem value="walkable">Walkable Downtown</SelectItem>
                        <SelectItem value="privacy">Privacy/Large Lot</SelectItem>
                        <SelectItem value="modern">Modern/New Construction</SelectItem>
                        <SelectItem value="historic">Historic Charm</SelectItem>
                        <SelectItem value="investment">Investment Property</SelectItem>
                        <SelectItem value="commute">Short Commute</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.topPriority && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.topPriority.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Lifestyle Priorities */}
          <div className="mb-10">
            <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
              Lifestyle Priorities
            </h2>

            <div className="space-y-5">
              {/* Work Situation */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Buyer's Work Arrangement
                </label>
                <Controller
                  name="workSituation"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { value: "office", label: "In-Office", icon: Briefcase },
                        { value: "hybrid", label: "Hybrid", icon: Monitor },
                        { value: "remote", label: "Remote", icon: Laptop },
                        { value: "retired", label: "Retired", icon: Palmtree },
                      ].map((option) => {
                        const Icon = option.icon;
                        const isSelected = field.value === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={`btn-group-item flex items-center justify-center gap-2 ${
                              isSelected ? "btn-group-item-selected" : ""
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                <p className="mt-1.5 text-sm text-text-tertiary">
                  Helps us prioritize commute accessibility
                </p>
              </div>

              {/* School-Age Children */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Does this buyer have school-age children?
                </label>
                <Controller
                  name="hasChildren"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => field.onChange(true)}
                        className={`btn-group-item w-24 ${
                          field.value === true ? "btn-group-item-selected" : ""
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange(false)}
                        className={`btn-group-item w-24 ${
                          field.value === false ? "btn-group-item-selected" : ""
                        }`}
                      >
                        No
                      </button>
                    </div>
                  )}
                />
                <p className="mt-1.5 text-sm text-text-tertiary">
                  Helps us emphasize school ratings
                </p>
              </div>

              {/* Lifestyle Focus */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-1">
                  Primary Lifestyle Priority
                </label>
                <span className="block text-sm text-text-tertiary mb-3">
                  Pick the best fit
                </span>
                <Controller
                  name="lifestyleFocus"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-3">
                      {[
                        {
                          value: "outdoor",
                          label: "Outdoor & Nature",
                          desc: "Parks, trails, recreation",
                          icon: TreePine,
                        },
                        {
                          value: "urban",
                          label: "Urban & Walkable",
                          desc: "Dining, shops, entertainment",
                          icon: MapPin,
                        },
                        {
                          value: "suburban",
                          label: "Quiet & Suburban",
                          desc: "Privacy, space, family-friendly",
                          icon: HomeIcon,
                        },
                        {
                          value: "convenient",
                          label: "Convenient & Central",
                          desc: "Short commutes, easy access",
                          icon: Zap,
                        },
                      ].map((option) => {
                        const Icon = option.icon;
                        const isSelected = field.value === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={`radio-card w-full text-left ${
                              isSelected ? "radio-card-selected" : ""
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? "border-primary" : "border-input"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                              )}
                            </div>
                            <Icon
                              className={`w-5 h-5 shrink-0 ${
                                isSelected ? "text-primary" : "text-text-tertiary"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <span
                                className={`block font-medium ${
                                  isSelected ? "text-primary" : "text-text-secondary"
                                }`}
                              >
                                {option.label}
                              </span>
                              <span className="block text-sm text-text-tertiary">
                                {option.desc}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Agent Insights (Required) */}
          <div className="mb-10">
            <h2 className="font-heading font-semibold text-lg text-foreground mb-1">
              Agent Insights <span className="text-destructive">*</span>
            </h2>
            <p className="text-sm text-text-tertiary mb-4">
              REQUIRED: Tell us the buyer's story, preferences, and must-haves (200-1200 characters)
            </p>

            <div>
              <Controller
                name="agentInsights"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <textarea
                      {...field}
                      placeholder="Example: Sarah and Mike are relocating from Boston. She's a teacher who loves Prescott Park. They want a historic home with character near downtown. Deal-breaker: HOAs with strict rules. They kayak every weekend and need water access..."
                      rows={4}
                      maxLength={1200}
                      className="form-input min-h-[120px] max-h-[200px] resize-y"
                    />
                    <span className={`absolute bottom-2 right-3 text-xs ${
                      (field.value?.length || 0) < 200 ? "text-amber-500" : "text-text-tertiary"
                    }`}>
                      {field.value?.length || 0}/1200 {(field.value?.length || 0) < 200 && `(min 200)`}
                    </span>
                  </div>
                )}
              />
              {errors.agentInsights && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors.agentInsights.message}
                </p>
              )}
              <p className="mt-2 text-sm text-text-tertiary italic">
                These insights help us personalize neighborhood recommendations and lifestyle details.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-submit flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Guide...</span>
                </>
              ) : (
                "Generate Buyer Guide"
              )}
            </button>

            {isSubmitting && (
              <p className="text-center text-sm text-text-tertiary animate-fade-in">
                This takes 2-3 minutes. We'll email it to{" "}
                <span className="font-medium">{watchedValues.agentEmail || "you"}</span>
              </p>
            )}

            <p className="text-center text-xs text-text-tertiary">
              By submitting, you confirm this buyer has consented to receive this guide.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuyerGuideForm;

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Home, Building2, Building, Sparkles, Briefcase, Laptop, Monitor, Palmtree, TreePine, MapPin, HomeIcon, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo from "@/assets/duston-leddy-logo.png";

// Form validation schema
const formSchema = z.object({
  agentEmail: z.string().email("Please enter a valid email address"),
  buyerName: z.string().min(1, "Buyer's name is required"),
  buyerSituation: z.string().min(1, "Please select a situation"),
  targetArea: z.string().min(1, "Please select an area"),
  budgetRange: z.array(z.number()).length(2),
  timeline: z.string().min(1, "Please select a timeline"),
  bedrooms: z.string().min(1, "Please select bedrooms"),
  bathrooms: z.string().min(1, "Please select bathrooms"),
  propertyTypes: z.array(z.string()).min(1, "Select at least one property type"),
  workSituation: z.string().min(1, "Please select work arrangement"),
  hasChildren: z.boolean(),
  lifestyleFocus: z.string().min(1, "Please select a lifestyle priority"),
});

type FormData = z.infer<typeof formSchema>;

const STORAGE_KEY = "buyer-guide-form-draft";

// Helper to format budget
const formatBudget = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${value / 1000}K`;
};

// Budget steps
const budgetSteps = [
  200000, 225000, 250000, 275000, 300000, 325000, 350000, 375000, 400000, 425000,
  450000, 475000, 500000, 525000, 550000, 575000, 600000, 625000, 650000, 675000,
  700000, 725000, 750000, 775000, 800000, 825000, 850000, 875000, 900000, 925000,
  950000, 975000, 1000000, 1100000, 1200000, 1300000, 1400000, 1500000, 1600000,
  1700000, 1800000, 1900000, 2000000
];

const BuyerGuideForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const defaultValues: FormData = {
    agentEmail: "",
    buyerName: "",
    buyerSituation: "first-time",
    targetArea: "portsmouth",
    budgetRange: [14, 26], // Index for $400K and $800K
    timeline: "3-6",
    bedrooms: "3",
    bathrooms: "2",
    propertyTypes: ["single-family"],
    workSituation: "hybrid",
    hasChildren: false,
    lifestyleFocus: "suburban",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
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
          setValue(key as keyof FormData, parsed[key]);
        });
      } catch (e) {
        console.error("Failed to parse saved form data");
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmittedEmail(data.agentEmail);

    // Convert budget indices to actual values
    const minBudget = budgetSteps[data.budgetRange[0]];
    const maxBudget = budgetSteps[data.budgetRange[1]];

    const payload = {
      ...data,
      budgetMin: minBudget,
      budgetMax: maxBudget,
      brokerage_slug: "duston-leddy",
      intake_pin: "847293",
    };

    try {
      // Simulate API call - replace with actual webhook
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Form submitted:", payload);
      
      localStorage.removeItem(STORAGE_KEY);
      setIsSuccess(true);
    } catch (error) {
      console.error("Submission failed:", error);
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
            Generate a Buyer Guide
          </h1>
          <p className="text-text-tertiary text-base">
            Complete in 90 seconds · Your buyer will receive a personalized 10-page market guide
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
            <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
              About Your Buyer
            </h2>

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

              {/* Target Area */}
              <div>
                <label className="block text-sm font-medium text-text-label mb-2">
                  Where are they looking?
                </label>
                <Controller
                  name="targetArea"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portsmouth">Portsmouth</SelectItem>
                        <SelectItem value="dover">Dover</SelectItem>
                        <SelectItem value="rye">Rye</SelectItem>
                        <SelectItem value="hampton">Hampton</SelectItem>
                        <SelectItem value="exeter">Exeter</SelectItem>
                        <SelectItem value="durham">Durham</SelectItem>
                        <SelectItem value="newmarket">Newmarket</SelectItem>
                        <SelectItem value="stratham">Stratham</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="mt-1.5 text-sm text-text-tertiary">
                  We'll focus the guide on this area
                </p>
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

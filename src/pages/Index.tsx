import BuyerGuideForm from "@/components/BuyerGuideForm";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Generate Buyer Guide | Duston Leddy Real Estate</title>
        <meta
          name="description"
          content="Create a personalized 10-page market guide for your real estate buyers in under 90 seconds. Professional, beautiful, and effortless."
        />
      </Helmet>
      <BuyerGuideForm />
    </>
  );
};

export default Index;

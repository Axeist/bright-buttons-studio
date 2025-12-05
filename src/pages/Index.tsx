import { PublicLayout } from "@/layouts/PublicLayout";
import { Hero } from "@/components/landing/Hero";
import { StorySection } from "@/components/landing/StorySection";
import { CollectionsSection } from "@/components/landing/CollectionsSection";
import { ProcessSection } from "@/components/landing/ProcessSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { ContactSection } from "@/components/landing/ContactSection";

const Index = () => {
  return (
    <PublicLayout>
      <Hero />
      <StorySection />
      <CollectionsSection />
      <ProcessSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
    </PublicLayout>
  );
};

export default Index;

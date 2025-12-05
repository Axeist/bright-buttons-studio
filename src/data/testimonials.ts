export interface Testimonial {
  id: number;
  name: string;
  location: string;
  text: string;
  rating: number;
  product?: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Mumbai",
    text: "The eco-printed saree I received is absolutely stunning! Each leaf print is unique and the colors are so vibrant. Received so many compliments at my friend's wedding.",
    rating: 5,
    product: "Monsoon Leaf Silk Saree"
  },
  {
    id: 2,
    name: "Anjali Krishnan",
    location: "Chennai",
    text: "Subhiksha's attention to detail is incredible. My custom kurtha set fits perfectly and the shibori work is museum-quality. Worth every rupee!",
    rating: 5,
    product: "Custom Shibori Kurtha"
  },
  {
    id: 3,
    name: "Meera Patel",
    location: "Bangalore",
    text: "I've been buying from Bright Buttons for a year now. The quality is consistently amazing and I love knowing my clothes are eco-friendly and unique.",
    rating: 5,
    product: "Multiple pieces"
  },
  {
    id: 4,
    name: "Ravi Kumar",
    location: "Hyderabad",
    text: "Got matching shirts for me and my son. The batik patterns are beautiful and the fabric is so comfortable. Great for our family photos!",
    rating: 5,
    product: "Batik Father-Son Set"
  },
  {
    id: 5,
    name: "Sneha Reddy",
    location: "Delhi",
    text: "The shawl I ordered is now my most treasured piece. The eco-printing technique creates such magical patterns. Truly wearable art.",
    rating: 5,
    product: "Autumn Maple Shawl"
  }
];

export const stats = [
  { value: "500+", label: "Orders Delivered" },
  { value: "1000+", label: "Unique Pieces Created" },
  { value: "100%", label: "Eco-Focused Materials" }
];

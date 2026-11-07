import { queryOptions } from "@tanstack/react-query";
import { fetchProducts, fetchProductByHandle } from "@/lib/shopify";
import { siteContent } from "@/content/site";

export const productsQuery = queryOptions({ queryKey: ["products"], queryFn: () => fetchProducts(24) });
export const productQuery = (handle: string) =>
  queryOptions({ queryKey: ["product", handle], queryFn: () => fetchProductByHandle(handle) });
export const productDetailsQuery = queryOptions({
  queryKey: ["content", "productDetails"],
  queryFn: () => siteContent.getProductDetails(),
});
export const homeContentQuery = queryOptions({
  queryKey: ["content", "home"],
  queryFn: async () => ({
    hero: await siteContent.getHero(),
    about: await siteContent.getAbout(),
    seminarsStatus: await siteContent.getSeminarsStatus(),
    seminarsCta: await siteContent.getHomeSeminarsCta(),
  }),
});
export const aboutQuery = queryOptions({ queryKey: ["content", "about"], queryFn: () => siteContent.getAbout() });
export const seminarsQuery = queryOptions({ queryKey: ["content", "seminars"], queryFn: () => siteContent.getSeminars() });
export const seminarsStatusQuery = queryOptions({
  queryKey: ["content", "seminars-status"],
  queryFn: () => siteContent.getSeminarsStatus(),
});
export const contactQuery = queryOptions({ queryKey: ["content", "contact"], queryFn: () => siteContent.getContact() });
export const termsQuery = queryOptions({ queryKey: ["content", "terms"], queryFn: () => siteContent.getTerms() });
export const privacyQuery = queryOptions({ queryKey: ["content", "privacy"], queryFn: () => siteContent.getPrivacy() });
export const seminarTermsQuery = queryOptions({
  queryKey: ["content", "seminar-terms"],
  queryFn: () => siteContent.getSeminarTerms(),
});

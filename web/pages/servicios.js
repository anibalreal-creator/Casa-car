import { CategorySeoLanding, getCategoryLandingProps } from '../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getCategoryLandingProps('servicios', context);
}

export default CategorySeoLanding;

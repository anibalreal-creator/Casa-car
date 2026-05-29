import { CategorySeoLanding, getCategoryLandingProps } from '../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getCategoryLandingProps('motos', context);
}

export default CategorySeoLanding;

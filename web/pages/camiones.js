import { CategorySeoLanding, getCategoryLandingProps } from '../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getCategoryLandingProps('camiones', context);
}

export default CategorySeoLanding;

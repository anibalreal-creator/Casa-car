import { CategorySeoLanding, getCategoryLandingProps } from '../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getCategoryLandingProps('propiedades', context);
}

export default CategorySeoLanding;

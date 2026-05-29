import { CategorySeoLanding, getCategoryLandingProps } from '../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getCategoryLandingProps('maquinaria', context);
}

export default CategorySeoLanding;

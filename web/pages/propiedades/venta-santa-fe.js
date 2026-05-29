import { TopicSeoLanding, getTopicLandingProps } from '../../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getTopicLandingProps('propiedades', 'venta-santa-fe', context);
}

export default TopicSeoLanding;

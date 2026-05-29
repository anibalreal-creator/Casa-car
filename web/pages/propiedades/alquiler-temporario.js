import { TopicSeoLanding, getTopicLandingProps } from '../../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getTopicLandingProps('propiedades', 'alquiler-temporario', context);
}

export default TopicSeoLanding;

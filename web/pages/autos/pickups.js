import { TopicSeoLanding, getTopicLandingProps } from '../../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getTopicLandingProps('autos', 'pickups', context);
}

export default TopicSeoLanding;

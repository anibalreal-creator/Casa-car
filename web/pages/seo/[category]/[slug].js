import ListingDetail, { getListingServerSideProps } from '../../listing/[id]';

export async function getServerSideProps(context) {
  return getListingServerSideProps(context, {
    slug: context.params?.slug,
    category: context.params?.category,
  });
}

export default ListingDetail;

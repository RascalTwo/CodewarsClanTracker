export default function LoadingIndicator({ loading }: { loading: boolean }){
	return <div className="loadingIndicator">{loading ? '↻' : ''}</div>
}
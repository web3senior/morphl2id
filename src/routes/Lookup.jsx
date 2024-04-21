import { useEffect, useRef, useState } from 'react'
import { useNavigate, defer, useParams } from 'react-router-dom'
import { Title } from './helper/DocumentTitle'
import MaterialIcon from './helper/MaterialIcon'
import Shimmer from './helper/Shimmer'
import Loading from './components/LoadingSpinner'
import { CheckIcon, ChromeIcon, BraveIcon } from './components/icons'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth, web3, _, Morphl2Contract } from '../contexts/AuthContext'
import styles from './Lookup.module.scss'

import Web3 from 'web3'
import ABI from '../abi/morphl2id.json'
import party from 'party-js'
// import { getApp } from './../util/api'

export const loader = async ({ request, params }) => {
  return defer({})
}

function App({ title }) {
  Title(title)
  const [isLoading, setIsLoading] = useState(true)
  const [app, setApp] = useState([])

  const [metadata, setMetadata] = useState()
  const [data, setData] = useState([])

  const auth = useAuth()
  const navigate = useNavigate()
  const params = useParams()

  const fetchIPFS = async (CID) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_IPFS_GATEWAY}${CID}`)
      if (!response.ok) throw new Response('Failed to get data', { status: 500 })
      const json = await response.json()
      return json
    } catch (error) {
      console.error(error)
    }
  }

  const getApp = async () => {
    let web3 = new Web3(import.meta.env.VITE_RPC_URL)
    const UpstoreContract = new web3.eth.Contract(ABI, import.meta.env.VITE_UPSTORE_CONTRACT_MAINNET)
    return await UpstoreContract.methods.getApp(params.appId).call()
  }

  const handleLike = async () => {
    if (!auth.wallet) {
      toast.error(`Please connect Universal Profile`)
      return
    }

    const t = toast.loading(`Waiting for transaction's confirmation`)

    try {
      let web3 = new Web3(window.lukso)
      web3.eth.defaultAccount = auth.wallet
      const UpstoreContract = new web3.eth.Contract(ABI, import.meta.env.VITE_UPSTORE_CONTRACT_MAINNET)
      return await UpstoreContract.methods
        .setLike(params.appId)
        .send({ from: auth.wallet })
        .then((res) => {
          console.log(res)
          toast.dismiss(t)

          // Refetch the like total
          getLike().then((res) => {
            setLike(web3.utils.toNumber(res))
          })

          // Party
          party.confetti(document.querySelector(`.party-holder`), {
            count: party.variation.range(20, 40),
            shapes: ['star', 'roundedSquare'],
          })
        })
    } catch (error) {
      console.error(error)
      toast.dismiss(t)
    }
  }

  const getResolve = async (address) => await Morphl2Contract.methods.resolver(address).call()

  useEffect(() => {
    let address = params.address.split('.')
    address = web3.utils.keccak256(web3.utils.toHex(web3.utils.toHex(`${address[0]}.${address[1]}`)))
    console.log(address)

    getResolve(address).then((res) => {
      setMetadata(res)
      fetchIPFS(res.metadata).then((obj) => {
        console.log(obj)
        setData(obj)
        setIsLoading(false)
      })
    })
  }, [])

  return (
    <>
      <section className={`${styles.section} s-motion-slideUpIn`}>
        <div className={`__container`} data-width={`medium`}>
          {isLoading && (
            <>
              {[1].map((item, i) => (
                <Shimmer key={i}>
                  <div style={{ width: `50px`, height: `50px` }} />
                </Shimmer>
              ))}
            </>
          )}

          <div className={`ms-Grid`} dir="ltr">
            <div className={`ms-Grid-row`}>
              <div className={`ms-Grid-col ms-sm12 ms-md12 ms-lg12`}>
                {data && data.hasOwnProperty(`name`) && (
                  <div className={`card party-holder`}>
                    <div className={`card__body d-flex flex-column align-items-center justify-content-center animate fade`}>
                      <figure className={`${styles['logo']}`} title={data.name}>
                        <img alt={data.name} src={`https://ipfs.io/ipfs/${data.pfp}`} />
                        <figcaption>{data.name}</figcaption>
                      </figure>
                      <span className={`btn`}>{params.address}</span>

                      {/* <div className={`mt-10`}>
                        {app[0].tags &&
                          app[0].tags.split(',').map((tag, i) => (
                            <span key={i} className={`badge badge-danger badge-pill ml-10`}>
                              {tag}
                            </span>
                          ))}
                      </div> */}
                    </div>
                  </div>
                )}
              </div>

              <div className={`ms-Grid-col ms-sm12 ms-md12 ms-lg12 mt-40`}>
                {data && data.hasOwnProperty(`wallet`) && (
                  <>
                    <div className={`${styles['wallet']} card grid grid--fit`} style={{ '--data-width': '400px' }}>
                      <div className={`card__header d-flex flex-row align-items-center justify-content-between`}>
                        <span>Main Domain [{params.address}]</span>
                      </div>
                      <div className={`card__body `}>
                        {data.wallet &&
                          data.wallet.length > 0 &&
                          data.wallet[0].domain.map((item, i) => (
                            <div className={` d-flex flex-row align-items-center justify-content-between`} key={i}>
                              <label className="alert alert--light">{item.name} </label>
                              <span className="badge badge-primary">{item.addr}</span>
                            </div>
                          ))}

                      </div>
                    </div>

                    <div className={`${styles['wallet']} card grid grid--fit mt-40`} style={{ '--data-width': '400px' }}>
                      <div className={`card__header d-flex flex-row align-items-center justify-content-between`}>
                        <span>Sub Domain [NAME.{params.address}]</span>
                      </div>
                      <div className={`card__body `}>
                        {data.wallet &&
                          data.wallet.length > 0 &&
                          data.wallet[0].subdomain.map((item, i) => (
                            <details className="alert alert--light">
                              <summary>{item.name}.{params.address}</summary>
                              <div className={`d-flex flex-column align-items-center justify-content-between`}>
                                {item.addresses.map(addressItem => <div  className={`d-flex flex-row align-items-center justify-content-between w-100 mt-20`}>
                                  <div>{addressItem.name}</div>
                                  <div>{addressItem.addr}</div>
                                </div>)}
                              </div>
                            </details>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className={`ms-Grid-col ms-sm12 ms-md12 ms-lg12 mt-40`}>
                {data && data.hasOwnProperty(`name`) && (
                  <>
                    <div className={`card`}>
                      <div className={`card__header d-flex flex-row align-items-center justify-content-between`}>
                        <span>Description</span>
                      </div>
                      <div className={`card__body ${styles['description']}`}>{data.description}</div>
                    </div>

                    <div className={`${styles['links']} grid grid--fit`} style={{ '--data-width': '124px' }}>
                      {data.links &&
                        data.links.length > 0 &&
                        data.links.map((item, i) => (
                          <a href={`${item.url}`} target={`_blank`} key={i}>
                            {item.name}
                          </a>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default App

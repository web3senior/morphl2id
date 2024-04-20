import { Suspense, useState, useEffect, useRef } from 'react'
import { useLoaderData, defer, Form, Await, useRouteError, Link, useNavigate } from 'react-router-dom'
import { Title } from './helper/DocumentTitle'
import MaterialIcon from './helper/MaterialIcon'
import Shimmer from './helper/Shimmer'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth, web3, _, Morphl2Contract } from './../contexts/AuthContext'
import Lips from './../../src/assets/lips.svg'
import Yummy from './../../src/assets/yummy.svg'
import FivePercent from './../../src/assets/5percent.svg'
import BannerPartyIcon from './../../src/assets/banner-party-icon.svg'
import Banner from './../../src/assets/banner.png'
import Web3 from 'web3'
import ABI from './../abi/morphl2id.json'
import party from 'party-js'
import styles from './Home.module.scss'

party.resolvableShapes['Vector7'] = `<img src=""/>`

const WhitelistFactoryAddr = web3.utils.padLeft(`0x2`, 64)

export const loader = async () => {
  return defer({ key: 'val' })
}

function Home({ title }) {
  Title(title)
  const [loaderData, setLoaderData] = useState(useLoaderData())
  const [isLoading, setIsLoading] = useState(true)

  const [recordTypeTotal, setRecordTypeTotal] = useState()
  const [resolveTotal, setResolveTotal] = useState()

  const [totalSupply, setTotalSupply] = useState(0)
  const [holderReward, setHolderReward] = useState(0)
  const [maxSupply, setMaxSupply] = useState(0)
  const [winner, setWinner] = useState('')
  const [candyPrimaryColor, setCandyPrimaryColor] = useState('#59F235')
  const [candySecondaryColor, setCandySecondaryColor] = useState('#0E852E')
  const auth = useAuth()
  const navigate = useNavigate()
  const txtSearchRef = useRef()

  const addMe = async () => {
    const t = toast.loading(`Loading`)
    try {
      web3.eth.defaultAccount = auth.wallet

      const whitelistFactoryContract = new web3.eth.Contract(ABI, import.meta.env.VITE_WHITELISTFACTORY_CONTRACT_MAINNET, {
        from: auth.wallet,
      })
      console.log(whitelistFactoryContract.defaultChain, Date.now())
      await whitelistFactoryContract.methods
        .addUser(WhitelistFactoryAddr)
        .send()
        .then((res) => {
          console.log(res)
          toast.dismiss(t)
          toast.success(`You hav been added to the list.`)
          party.confetti(document.querySelector(`h4`), {
            count: party.variation.range(20, 40),
          })
        })
    } catch (error) {
      console.error(error)
      toast.dismiss(t)
    }
  }

  const addUserByManager = async () => {
    const t = toast.loading(`Loading`)
    try {
      web3.eth.defaultAccount = auth.wallet

      const whitelistFactoryContract = new web3.eth.Contract(ABI, import.meta.env.VITE_WHITELISTFACTORY_CONTRACT_MAINNET, {
        from: auth.wallet,
      })

      await whitelistFactoryContract.methods
        .addUserByManager(WhitelistFactoryAddr)
        .send()
        .then((res) => {
          console.log(res)
          toast.dismiss(t)
          toast.success(`You hav been added to the list.`)
          party.confetti(document.querySelector(`h4`), {
            count: party.variation.range(20, 40),
          })
        })
    } catch (error) {
      console.error(error)
      toast.dismiss(t)
    }
  }

  const updateWhitelist = async () => {
    web3.eth.defaultAccount = `0x188eeC07287D876a23565c3c568cbE0bb1984b83`

    const whitelistFactoryContract = new web3.eth.Contract('', `0xc407722d150c8a65e890096869f8015D90a89EfD`, {
      from: '0x188eeC07287D876a23565c3c568cbE0bb1984b83', // default from address
      gasPrice: '20000000000',
    })
    console.log(whitelistFactoryContract.defaultChain, Date.now())
    await whitelistFactoryContract.methods
      .updateWhitelist(web3.utils.utf8ToBytes(1), `q1q1q1q1`, false)
      .send()
      .then((res) => {
        console.log(res)
      })
  }

  const createWhitelist = async () => {
    console.log(auth.wallet)
    web3.eth.defaultAccount = auth.wallet

    const whitelistFactoryContract = new web3.eth.Contract(ABI, import.meta.env.VITE_WHITELISTFACTORY_CONTRACT_MAINNET)
    await whitelistFactoryContract.methods
      .addWhitelist(``, Date.now(), 1710102205873, `0x0D5C8B7cC12eD8486E1E0147CC0c3395739F138d`, [])
      .send({ from: auth.wallet })
      .then((res) => {
        console.log(res)
      })
  }

  const handleSearch = async () => {
    let dataFilter = app
    if (txtSearchRef.current.value !== '') {
      let filteredData = dataFilter.filter((item) => item.name.toLowerCase().includes(txtSearchRef.current.value.toLowerCase()))
      if (filteredData.length > 0) setApp(filteredData)
    } else setApp(backApp)
  }

  const fetchIPFS = async (CID) => {
    try {
      const response = await fetch(`https://api.universalprofile.cloud/ipfs/${CID}`)
      if (!response.ok) throw new Response('Failed to get data', { status: 500 })
      const json = await response.json()
      // console.log(json)
      return json
    } catch (error) {
      console.error(error)
    }

    return false
  }

  const getLike = async (appId) => {
    let web3 = new Web3(import.meta.env.VITE_RPC_URL)
    const UpstoreContract = new web3.eth.Contract(ABI, import.meta.env.VITE_UPSTORE_CONTRACT_MAINNET)
    return await UpstoreContract.methods.getLikeTotal(appId).call()
  }

  const handleRemoveRecentApp = async (e, appId) => {
    localStorage.setItem('appSeen', JSON.stringify(recentApp.filter((reduceItem) => reduceItem.appId !== appId)))

    // Refresh the recent app list
    getRecentApp().then((res) => {
      setRecentApp(res)
    })
  }

  const getRecordTypeTotal = async () => await Morphl2Contract.methods._recordTypeCounter().call()
  const getResolveTotal = async () => await Morphl2Contract.methods._resolveCounter().call()
  const handleMint = async (e) => {
    if (!price) {
      toast.error(`Can't read the mint price`)
      return false
    }
    const t = toast.loading(`Waiting for transaction's confirmation`)
    e.target.innerText = `Waiting...`
    if (typeof window.lukso === 'undefined') window.open('https://chromewebstore.google.com/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn?hl=en-US&utm_source=candyzap.com', '_blank')

    try {
      window.lukso
        .request({ method: 'eth_requestAccounts' })
        .then((accounts) => {
          const account = accounts[0]
          console.log(account)
          // walletID.innerHTML = `Wallet connected: ${account}`;

          web3.eth.defaultAccount = account
          Morphl2Contract.methods
            .newMint()
            .send({
              from: account,
              value: web3.utils.toWei(price, 'ether'),
            })
            .then((res) => {
              setWinner(res.events.Rewarded.returnValues[0])
              console.log('Winner:' + res.events.Rewarded.returnValues[0])
              // Run partyjs
              party.confetti(document.querySelector(`header`), {
                count: party.variation.range(20, 40),
                shapes: ['Vector0', 'Vector1', 'Vector2', 'Vector3', 'Vector4', 'Vector5', 'Vector6', 'Vector7'],
              })

              e.target.innerText = `Mint`
              toast.dismiss(t)
            })
            .catch((error) => {
              e.target.innerText = `Mint`
              toast.dismiss(t)
            })
          // Stop loader when connected
          //connectButton.classList.remove("loadingButton");
        })
        .catch((error) => {
          e.target.innerText = `Mint`
          // Handle error
          console.log(error, error.code)
          toast.dismiss(t)
          // Stop loader if error occured

          // 4001 - The request was rejected by the user
          // -32602 - The parameters were invalid
          // -32603- Internal error
        })
    } catch (error) {
      console.log(error)
      toast.dismiss(t)
      e.target.innerText = `Mint`
    }
  }

  useEffect(() => {
    getRecordTypeTotal().then(async (res) => {
      console.log(res)
      setRecordTypeTotal(web3.utils.toNumber(res))
      setIsLoading(false)
    })

    getResolveTotal().then(async (res) => {
      setResolveTotal(web3.utils.toNumber(res))
      setIsLoading(false)
    })
  }, [])

  return (
    <>
      <section className={styles.section}>
        <div className={`__container`} data-width={`large`}>
          <div className={`${styles['lips']} d-flex flex-column align-items-center justify-content-center ms-motion-slideDownIn`}>
            <h3>
              <b>Register Morph domain name</b>
            </h3>
            <p>Secure your digital presence by registering this domain now it's available for you</p>

            <div className={`${styles['domain-card']} card d-flex flex-column align-items-center justify-content-between`}>
              <ul className={`d-flex flex-row align-items-center justify-content-between w-100`}>
                <li>id-card</li>
                <li>
                  100% <br /> ownership
                </li>
              </ul>

              <div className={styles['form-input']}>
                <input type="text" name="atenyun.morph" id="" />
              </div>

              <p className={`${styles['copyright']}`}>
                Developed by{' '}
                <Link to={`//aratta.dev`} target={`_blank`}>
                  Aratta Labs
                </Link>
                <br />
                for Morph community
              </p>
            </div>
          </div>

          <div className={`${styles['statistics']} grid grid--fit`} style={{ '--data-width': '124px' }}>
            <StatisticCard name={`record types`} total={recordTypeTotal} />
            <StatisticCard name={`names`} total={resolveTotal} />
            <StatisticCard name={`sub domains`} total={resolveTotal} />
            <StatisticCard name={`DID`} total={resolveTotal} />
          </div>


          <div className={`__container`} data-width={`small`}>
          <h4>Morph Ecosystem Wallets</h4>
            <div className={`card`}>
              <div className={`card__body d-flex flex-column align-items-center justify-content-between`}>s</div>
            </div>
          </div>

        </div>
      </section>
    </>
  )
}

const StatisticCard = (props) => {
  return (
    <div className={`card`}>
      <div className={`card__body d-flex flex-column align-items-center justify-content-between`}>
        <span className={`ms-fontSize-24`}>{props.total}</span>
        <span className={`ms-fontSize-12 ms-fontWeight-regular`}>{props.name}</span>
      </div>
    </div>
  )
}

export default Home

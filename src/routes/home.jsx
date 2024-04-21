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
import KoalaPolygonal from './../../src/assets/koala-polygonal.png'
import BlockchainShield from './../../src/assets/blockchain-shield.svg'
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
  const [recordTypeList, setRecordTypeList] = useState()
  const [availableName, setAvailableName] = useState()
  const [registeredName, setRegisteredName] = useState()

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
          //toast.dismiss(toastId)
          toast.success(`You hav been added to the list.`)
          party.confetti(document.querySelector(`h4`), {
            count: party.variation.range(20, 40),
          })
        })
    } catch (error) {
      console.error(error)
      //toast.dismiss(toastId)
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
          //toast.dismiss(toastId)
          toast.success(`You hav been added to the list.`)
          party.confetti(document.querySelector(`h4`), {
            count: party.variation.range(20, 40),
          })
        })
    } catch (error) {
      console.error(error)
      //toast.dismiss(toastId)
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

  const handleRemoveRecentApp = async (e, appId) => {
    localStorage.setItem('appSeen', JSON.stringify(recentApp.filter((reduceItem) => reduceItem.appId !== appId)))

    // Refresh the recent app list
    getRecentApp().then((res) => {
      setRecentApp(res)
    })
  }

  const getRecordTypeTotal = async () => await Morphl2Contract.methods._recordTypeCounter().call()

  const getRecordTypeList = async () => await Morphl2Contract.methods.getRecordTypeList().call()

  const getResolveTotal = async () => await Morphl2Contract.methods._resolveCounter().call()

  const isFreeToRegister = async (e) => {
    e.preventDefault()

    if (availableName) {
      handleBuy(e)
      return
    }

    let formData = new FormData(e.target)
    let address = formData.get(`address`)
    let recordType = formData.get(`recordType`)
    let recordTypeInfo = await Morphl2Contract.methods.getRecordType(recordType).call()

    address = web3.utils.keccak256(web3.utils.toHex(web3.utils.toHex(`${address}.${recordTypeInfo.name}`)))

    document.querySelector(`#btnRegister`).innerText = `Waiting...`
    document.querySelector(`#btnRegister`).disabled = true

    if (typeof window.ethereum === 'undefined') window.open('https://chromewebstore.google.com/', '_blank')

    try {
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((accounts) => {
          const account = accounts[0]
          console.log(account)
          // walletID.innerHTML = `Wallet connected: ${account}`;

          web3.eth.defaultAccount = account
          Morphl2Contract.methods
            .isFreeToRegister(address)
            .call()
            .then((res) => {
              console.log(res)
              document.querySelector(`#btnRegister`).innerText = `Confirm`
              document.querySelector(`#btnRegister`).disabled = false

              document.querySelector(`.registerResult`).innerText = res ? `🎉Congratulations!! the domain is available to register.` : `⛔Please try another name`

              if (res) {
                party.confetti(document.querySelector(`.registerResult`), {
                  count: party.variation.range(20, 40),
                })
              }

              setAvailableName(address)
            })
            .catch((error) => {
              document.querySelector(`#btnRegister`).innerText = `Register`
              document.querySelector(`#btnRegister`).disabled = false
            })
          // Stop loader when connected
          //connectButton.classList.remove("loadingButton");
        })
        .catch((error) => {
          document.querySelector(`#btnRegister`).innerText = `Register`
          // Handle error
          console.log(error, error.code)

          // Stop loader if error occured

          // 4001 - The request was rejected by the user
          // -32602 - The parameters were invalid
          // -32603- Internal error
        })
    } catch (error) {
      console.log(error)

      document.querySelector(`#btnRegister`).innerText = `Register`
    }
  }

  const handleBuy = async (e) => {
    if (!availableName) return

    // const toastId = toast.loading(`Waiting for transaction's confirmation`)

    let formData = new FormData(e.target)
    let address = formData.get(`address`)
    let recordType = formData.get(`recordType`)
    let recordTypeInfo = await Morphl2Contract.methods.getRecordType(recordType).call()

    document.querySelector(`#btnRegister`).innerText = `Waiting...`
    document.querySelector(`#btnRegister`).disabled = true

    if (typeof window.ethereum === 'undefined') window.open('https://chromewebstore.google.com/', '_blank')

    try {
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((accounts) => {
          const account = accounts[0]
          console.log(account)
          // walletID.innerHTML = `Wallet connected: ${account}`;

          web3.eth.defaultAccount = account
          Morphl2Contract.methods
            .register(address, recordTypeInfo.id)
            .send({
              from: account,
              value: recordTypeInfo.price,
            })
            .then((res) => {
              //toast.dismiss(toastId)
              console.log(res)
              document.querySelector(`#btnRegister`).innerText = `Register`
              document.querySelector(`#btnRegister`).disabled = false

              document.querySelector(`.registerResult`).innerHTML = `🎉 ${address}.${recordTypeInfo.name} has been registered for 360 days.`

              party.confetti(document.querySelector(`.registerResult`), {
                count: party.variation.range(20, 40),
              })

              setAvailableName()
              setRegisteredName(`${address}.${recordTypeInfo.name}`)
            })
            .catch((error) => {
              document.querySelector(`#btnRegister`).innerText = `Confirm`
              document.querySelector(`#btnRegister`).disabled = false
              //toast.dismiss(toastId)
            })
          // Stop loader when connected
          //connectButton.classList.remove("loadingButton");
        })
        .catch((error) => {
          //toast.dismiss(toastId)
          document.querySelector(`#btnRegister`).innerText = `Confirm`
          // Handle error
          console.log(error, error.code)

          // Stop loader if error occured

          // 4001 - The request was rejected by the user
          // -32602 - The parameters were invalid
          // -32603- Internal error
        })
    } catch (error) {
      console.log(error)
      //toast.dismiss(toastId)
      document.querySelector(`#btnRegister`).innerText = `Confirm`
    }
  }

  useEffect(() => {
    getRecordTypeList().then(async (res) => {
      console.log(res)
      setRecordTypeList(res)
      setIsLoading(false)
    })

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
          <div className={`d-flex flex-column align-items-center justify-content-center ms-motion-slideDownIn`}>
            <figure className={`${styles['koala']}`}>
              <img src={KoalaPolygonal} />
            </figure>

            <h1 className={`d-flex flex-column align-items-center justify-content-center`}>Register Morph Name</h1>
            <p className={`${styles['note']} text-center`}>
              Morph Naming Services (MNS) is decentralized, more secure, gives users ownership of their domains, and allows memorable names for easier transactions.
            </p>

            <div
              className={`${styles['domain-card']} card d-flex flex-column align-items-center justify-content-between`}
              onMouseOver={() => document.querySelector(`.${styles['koala']}`).classList.add(styles['koala-hover'])}
              onMouseOut={() => document.querySelector(`.${styles['koala']}`).classList.remove(styles['koala-hover'])}
            >
              <ul className={`d-flex flex-row align-items-center justify-content-between w-100`}>
                <li>id-card</li>
                <li>
                  100% <br /> ownership
                </li>
              </ul>

              <form action="" className={`${styles['form-input']}`} onSubmit={(e) => isFreeToRegister(e)}>
                <div className={` d-flex flex-column align-items-center justify-content-between`}>
                  <input type="text" name="address" id="" maxLength={13} placeholder={`vitalik`} pattern={`^[a-z1-9\.]{3,13}`} autoComplete={`off`} required />
                  <select name={`recordType`} className="mt-10">
                    {!recordTypeList && <option>Reading...</option>}
                    {recordTypeList &&
                      recordTypeList.map((item, i) => (
                        <option value={item.id} key={i}>
                          🆔.{item.name} 💰 {web3.utils.fromWei(item.price, 'ether').toString()} $ETHM 📅 a year
                        </option>
                      ))}
                  </select>
                </div>

                <small className={`registerResult mt-10 text-center`}></small>

                {registeredName && (
                  <Link to={registeredName} target={`_blank`}>
                    {` View `}
                  </Link>
                )}

                <div className={`d-flex flex-row align-items-center justify-content-between mt-40`} style={{ columnGap: `1.5rem` }}>
                  <button type={`submit`} id={`btnRegister`}>
                    Register
                  </button>
                </div>
              </form>

              <p className={`${styles['copyright']} mt-20`}>
                <img src={BlockchainShield} />
                <br />
                <br />
                Developed by{' '}
                <Link to={`//aratta.dev`} target={`_blank`}>
                  Aratta Labs
                </Link>
                <br />
                for the Morph community
              </p>
            </div>
          </div>

          <div className={`${styles['statistics']} grid grid--fit`} style={{ '--data-width': '124px' }}>
            <StatisticCard name={`record types`} total={recordTypeTotal} />
            <StatisticCard name={`names`} total={resolveTotal} />
            <StatisticCard name={`DID`} total={resolveTotal} />
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

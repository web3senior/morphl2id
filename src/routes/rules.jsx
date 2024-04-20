import { Title } from './helper/DocumentTitle'
import styles from './Rules.module.scss'

export default function About({ title }) {
  Title(title)

  return (
    <section className={styles.section}>
      <div className={`__container ms-motion-slideUpIn ${styles['container']}`} data-width={`large`}>
        <div className={`card ms-depth-4 text-justify`}>
          <div className="card__header">{title}</div>
          <div className="card__body">
            <ul className="d-flex flex-column" style={{ rowGap: `1rem`, listStyleType: 'space-counter' }}>
              <li>CandyZap distributes 5% of the mint price to a randomly selected holder.</li>
              <li>
                All operations are conducted through a smart contract that has been verified and audited on the <b>LUKSO</b> network.
              </li>
              <li>After the tokens are minted, the sender's wallet will be added to the list of ticket pools.</li>
              <li>There are no criteria or limitations in place to designate a wallet address as a winner.</li>
              <li>
                It is important to note that the winner's address will remain listed in the reward pool, irrespective of whether the token is sold in a marketplace or transferred to another wallet
                address.
              </li>
              <li>The owner of the contract has the ability to modify the public mint price.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
